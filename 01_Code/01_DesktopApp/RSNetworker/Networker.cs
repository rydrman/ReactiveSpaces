﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Diagnostics;

using System.Net.Sockets;
using System.Net;
using System.Threading;
using System.Security.Cryptography;
using System.Web.Script.Serialization;
using System.IO;
//using System.IO.Compression;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Formatters.Binary;

using RSKinect;

namespace RSNetworker
{

    public class Networker
    {
        //flags for watching
        public bool connected = false;
        public bool connectionChanged = false;
        public bool stationProfileUpdated = true;
        public bool peerListUpdated = false;
        public bool newRemoteKinect = false;
        public bool closing = false;

        //data to show
        Stopwatch kinectTimer;
        bool socketInUse = false;
        int socketTimeout = 1000;
        public StationProfile currentProfile;
        public List<StationProfile> currentPeers;
        AppInfo currentApp = null;

        JavaScriptSerializer jSerializer;

        string missingPiece = null;
        int failedMessages = 0;

        string serverBaseURL = "reactivespacesapi.com";
        int serverPort = 8080;
        TcpClient server = null;
        Task serverThread = null;
        NetworkStream serverStream = null;

        //so that we can skip the ui
        //delegat functions to local networker
        public delegate void onCustomDataRecieved(string data);
        public delegate void onPeerAdded(StationProfile peer);
        public delegate void onPeerUpdated(StationProfile peer);
        public delegate void onPeerRemoved(StationProfile peer);
        public delegate void OnRemoteKinectRecieved(KinectSkeleton skeleton);
        public delegate void OnRemoteKinectAdded(KinectSkeleton skeleton);
        public delegate void OnRemoteKinectRemoved(KinectSkeleton skeleton);
        public delegate void OnFeaturesMissing(List<AppFeatures> features);

        public onCustomDataRecieved _onCustomDataRecieved = null;
        public onPeerAdded _onPeerAdded = null;
        public onPeerUpdated _onPeerUpdated = null;
        public onPeerRemoved _onPeerRemoved = null;
        public OnRemoteKinectRecieved _onRemoteKinectRecieved = null;
        public OnRemoteKinectAdded _onRemoteKinectAdded = null;
        public OnRemoteKinectRemoved _onRemoteKinectRemoved = null;
        public OnFeaturesMissing _onFeaturesMissing = null;

        public Networker(List<AppFeatures> features)
        {
            kinectTimer = new Stopwatch();
            kinectTimer.Start();
            //check for saved profile
            currentProfile = new StationProfile();
            if (File.Exists("profile.bin"))
            {
                try
                {
                    using (FileStream fStream = File.OpenRead("profile.bin"))
                    {
                        byte[] profileBytes = new byte[fStream.Length];
                        fStream.Read(profileBytes, 0, profileBytes.Length);
                        currentProfile.FromBytes(profileBytes);
                        stationProfileUpdated = true;
                    }
                }
                catch { }
            }
            currentProfile.features = features;
            currentPeers = new List<StationProfile>();

            jSerializer = new JavaScriptSerializer();

            SocketError result = ConnectToServer();

            if(result != SocketError.Success)
            {
                //connection not made
                //Debugger.Break();
                return;
            }
        }

        private SocketError ConnectToServer()
        {
            server = new TcpClient();
            IPAddress[] addresses = System.Net.Dns.GetHostAddresses(serverBaseURL);

            if (addresses.Length == 0)
            {
                return SocketError.AddressNotAvailable;
            }

            IPEndPoint serverEndPoint = new IPEndPoint(addresses[0], serverPort);
            try
            {
                server.Connect(serverEndPoint);
            }
            catch(SocketException e)
            {
                return e.SocketErrorCode;
            }
            serverStream = server.GetStream();
            connected = true;

            System.Threading.Thread.Sleep(100);

            if (serverThread == null)
            {
                serverThread = new Task(ServerConnectionHandler);
            }
            if(serverThread.Status != TaskStatus.Running)
            {
                serverThread.Start();
            }

            return SocketError.Success;
        }

        private bool isConnectedWaiting()
        {
            if (closing
                || !connected
                || serverStream == null)
                return false;

            if (server.Client.Poll(0, SelectMode.SelectRead))
            {
                byte[] bytes = new byte[1];
                if (server.Client.Receive(bytes, SocketFlags.Peek) == 0)
                {
                    // Client disconnected
                    return false;
                }
                else
                {
                    return true;
                }
            }
            return true;
        }

        private void ServerConnectionHandler()
        {
            handlerStart:

            connected = true;
            connectionChanged = true;

            sendStationProfile();
            if (currentApp != null)
                updateAppInfo(currentApp);

            while(!closing && connected && server.Connected)
            {
                try
                {
                    while (isConnectedWaiting() && !serverStream.DataAvailable) ;
                }
                catch(Exception e)
                {
                    break;
                }

                //only time we actually want this thread to run to completion
                if (closing) return;

                if (serverStream == null || !connected || !isConnectedWaiting()) break;

                byte[] bytes = new byte[server.Available];
                serverStream.Read(bytes, 0, bytes.Length);

                String inData = Encoding.UTF8.GetString(bytes);

                //not sure that this is a real thing
                //if (inData.StartsWith("\0\0\0"))
                //{
                    //TODO server shutdown
                    //Disconnect();
                    //break;
                //}

                if (missingPiece != null)
                {
                    inData = missingPiece + inData;
                    missingPiece = null;
                }

                char[] splitter = {'\0'};
                string[] inMessages = inData.Split(splitter);

                foreach (string data in inMessages)
                {
                    if (data == "") continue;

                    SocketMessage message;
                    try
                    {
                        message = jSerializer.Deserialize<SocketMessage>(data);
                    }
                    catch
                    {
                        if(missingPiece == null && data == inMessages.Last())
                        {
                            missingPiece = data;
                        }
                        else
                        {
                            failedMessages++;
                        }
                        continue;
                    }
             
                    switch (message.type)
                    {
                        case MessageType.AppInfo:
                            AppInfo appInfo = jSerializer.Deserialize<AppInfo>(message.data);
                            break;
                        case MessageType.StationProfile:
                            //should only ever get assigned an id
                            StationProfile profile = jSerializer.Deserialize<StationProfile>(message.data);
                            currentProfile.SetID( profile.id );
                            stationProfileUpdated = true;
                            break;
                        case MessageType.PeerConnect:
                            StationProfile newPeer = jSerializer.Deserialize<StationProfile>(message.data);
                            updateAddPeer(newPeer);
                            if (null != _onPeerAdded)
                                _onPeerAdded(newPeer);
                            break;
                        case MessageType.PeerUpdate:
                            StationProfile peer = jSerializer.Deserialize<StationProfile>(message.data);
                            updateAddPeer(peer);
                            if (null != _onPeerUpdated)
                                _onPeerUpdated(peer);
                            break;
                        case MessageType.PeerDisconnect:
                            StationProfile oldPeer = jSerializer.Deserialize<StationProfile>(message.data);
                            removePeer(oldPeer);
                            if (null != _onPeerRemoved)
                                _onPeerRemoved(oldPeer);
                            break;
                        case MessageType.Custom:
                            if (null != _onCustomDataRecieved)
                                _onCustomDataRecieved(message.data);
                            break;
                        case MessageType.AddKinect:
                            KinectSkeleton newSkeleton = jSerializer.Deserialize<KinectSkeleton>(message.data);
                            addRemoteKinect(newSkeleton);
                            break;
                        case MessageType.Kinect:
                            KinectSkeleton skeleton = jSerializer.Deserialize<KinectSkeleton>(message.data);
                            processRemoteKinect(skeleton);
                            break;
                        case MessageType.RemoveKinect:
                            KinectSkeleton oldSkeleton = jSerializer.Deserialize<KinectSkeleton>(message.data);
                            removeRemoteKinect(oldSkeleton);
                            break;
                        case MessageType.FeatureMissing:
                            List<AppFeatures> missing = jSerializer.Deserialize<List<AppFeatures>>(message.data);
                            if (_onFeaturesMissing != null)
                                _onFeaturesMissing(missing);
                            break;
                        case MessageType.KeepAlive:
                            SocketMessage resp = new SocketMessage();
                            resp.type = MessageType.KeepAlive;
                            resp.data = "{}";
                            SendMessage(resp);
                            break;
                        default:
                            Debug.WriteLine("Unknown message type recieved from server.");
                            break;
                    }
                }
            }
            
            //reconnect
            Disconnect();
            if (closing)
            {
                return;
            }
            System.Threading.Thread.Sleep(100);
            ConnectToServer();

            goto handlerStart;
        }

        public void sendCustomData(string data)
        {
            SocketMessage message = new SocketMessage();
            message.type = MessageType.Custom;
            message.data = data;

            SendMessage(message);
        }

        public void Reconnect()
        {
            Disconnect();
            ConnectToServer();

            //if (serverThread == null)
            //   ConnectToServer();
            //else
            //    connected = false;
        }

        public void Disconnect()
        {
            if(closing)
            {
                //save out our profile
                try
                {
                    using (FileStream fStream = File.OpenWrite("profile.bin"))
                    {
                        byte[] profile = currentProfile.ToBytes();
                        fStream.Write(profile, 0, profile.Length);
                    }
                }
                catch { }
            }
            if (serverStream != null)
            {
                serverStream.Close();
                serverStream = null;
            }
            if (server != null)
            {
                try
                {
                    server.GetStream().Close();
                }catch { }
                try
                {
                    server.Close();
                }
                catch { }
                server = null;
            }
            connected = false;
            connectionChanged = true;
        }

        public void updateAppInfo(AppInfo newInfo)
        {
            if (currentApp != null || newInfo == null)
            {
                //the app was closed or we are switching apps
                SocketMessage message = new SocketMessage();
                message.type = MessageType.AppInfo;
                message.data = null;
                SendMessage(message);
            }

            if(null != newInfo)
            {
                //the app was connected
                SocketMessage message = new SocketMessage();
                message.type = MessageType.AppInfo;
                message.data = jSerializer.Serialize(newInfo);
                SendMessage(message);
            }

            currentApp = newInfo;
        }

        public void updateStationProfile(StationProfile newProfile)
        {
            this.currentProfile = newProfile;
            sendStationProfile();
        }

        void sendStationProfile()
        {
            SocketMessage message = new SocketMessage();
            message.type = MessageType.StationProfile;
            message.data = jSerializer.Serialize(currentProfile);

            SendMessage(message);
        }

        void updateAddPeer(StationProfile newPeer)
        {
            foreach (StationProfile s in currentPeers)
            {
                if(s.id == newPeer.id)
                {
                    //TODO tell local client
                    s.name = newPeer.name;
                    s.location = newPeer.location;
                    peerListUpdated = true;
                    return;
                }
            }
            //otherwise add it
            currentPeers.Add(newPeer);
            peerListUpdated = true;
        }
        void removePeer(StationProfile oldPeer)
        {
            StationProfile toRemove = null;
            foreach (StationProfile s in currentPeers)
            {
                if (s.id == oldPeer.id)
                {
                    toRemove = s;
                }
            }
            if(toRemove != null)
            {
                currentPeers.Remove(toRemove);
                peerListUpdated = true;
            }
        }

        public void addLocalKinect(KinectSkeleton skeleton)
        {
            if (this.currentApp == null)
                return;

            SocketMessage message = new SocketMessage();
            message.type = MessageType.AddKinect;
            message.data = jSerializer.Serialize(skeleton);

            SendMessage(message);
        }
        public void updateLocalKinect(KinectSkeleton[] players)
        {
            if (this.currentApp == null)
                return;

            //if it hasn't been long enough
            if (kinectTimer.ElapsedMilliseconds < 100)
                return;
            else
                kinectTimer.Restart();

            this.currentProfile.CopyPlayers(players); 

            foreach (KinectSkeleton s in currentProfile.players)
            {
                if (!s.userPresent) continue;

                SocketMessage message = new SocketMessage();
                message.type = MessageType.Kinect;
                message.data = jSerializer.Serialize(s);

                SendMessage(message);
            }
        }
        public void removeLocalKinect(KinectSkeleton skeleton)
        {
            if (this.currentApp == null)
                return;

            SocketMessage message = new SocketMessage();
            message.type = MessageType.RemoveKinect;
            message.data = jSerializer.Serialize(skeleton);

            SendMessage(message);
        }

        void addRemoteKinect(KinectSkeleton remote)
        {
            processRemoteKinect(remote, false);
            if (_onRemoteKinectAdded != null)
                _onRemoteKinectAdded(remote);
        }
        void processRemoteKinect(KinectSkeleton remote, bool fireEvent = true)
        {
            foreach (StationProfile peer in currentPeers)
            {
                if (peer.id == remote.stationID)
                {
                    //check to see if this is the first time we are seeing it and fire 
                    //added event. This takes care of skeletons that existed before connecting
                    if(peer.players[remote.playerNumber] == null || peer.players[remote.playerNumber].userPresent == false)
                    {
                        if (_onRemoteKinectAdded != null)
                            _onRemoteKinectAdded(remote);
                    }
                    peer.players[remote.playerNumber] = remote;

                    if (fireEvent && _onRemoteKinectRecieved != null)
                    {
                        _onRemoteKinectRecieved(remote);
                        newRemoteKinect = true;
                    }
                }
            }
        }
        void removeRemoteKinect(KinectSkeleton remote)
        {
            processRemoteKinect(remote, false);
            if (_onRemoteKinectRemoved != null)
                _onRemoteKinectRemoved(remote);
        }

        public void addFeature(AppFeatures feature)
        {
            if (currentProfile.features.Contains(feature)) return;

            currentProfile.features.Add(feature);
            stationProfileUpdated = true;
            sendStationProfile();
        }
        public void removeFeature(AppFeatures feature)
        {
            currentProfile.features.Remove(feature);
            stationProfileUpdated = true;
            sendStationProfile();
        }

        bool SendMessage(SocketMessage message)
        {
            string src = jSerializer.Serialize(message);
            byte[] msg = Encoding.UTF8.GetBytes(src + "\0");

            if (isConnectedWaiting())
            {
                try
                {
                    if(this.socketInUse)
                    {
                        Stopwatch timeout = new Stopwatch();
                        timeout.Start();
                        while(this.socketInUse)
                        {
                            if( timeout.ElapsedMilliseconds > socketTimeout )
                            {
                                Debug.WriteLine("socket timout...");
                                return false;
                            }
                        }
                    }
                    this.socketInUse = true;
                    serverStream.Write(msg, 0, msg.Length);
                    this.socketInUse = false;
                }
                catch (System.IO.IOException e)
                {
                    //failure writing to stream
                    //or
                    //error writing to socket
                    Debug.WriteLine("Failure writing to server socket. IO Exception.");
                    Disconnect();
                    return false;
                }
                catch (ObjectDisposedException e)
                {
                    //stream is closed
                    //or
                    //failure reading from network
                    Debug.WriteLine("Failure writing to server socket. Obj Disposed Exception.");
                    Disconnect();
                    return false;
                }
            }
            return true;
        }
    }
}
