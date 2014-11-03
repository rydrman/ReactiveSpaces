using System;
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
        bool serverReady = false;

        //so that we can skip the ui
        //delegat functions to local networker
        public delegate void onCustomDataRecieved(string data);
        public onCustomDataRecieved _onCustomDataRecieved = null;
        public delegate void onPeerAdded(StationProfile peer);
        public onPeerAdded _onPeerAdded = null;
        public delegate void onPeerUpdated(StationProfile peer);
        public onPeerUpdated _onPeerUpdated = null;
        public delegate void onPeerRemoved(StationProfile peer);
        public onPeerRemoved _onPeerRemoved = null;
        public delegate void OnRemoteKinectRecieved(KinectSkeleton skeleton);
        public OnRemoteKinectRecieved _onRemoteKinectRecieved = null;

        public Networker()
        {
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
            serverReady = true;

            sendStationProfile();
            if (currentApp != null)
                updateAppInfo(currentApp);

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

        private void ServerConnectionHandler()
        {
            handlerStart:

            connected = true;
            connectionChanged = true;

            while(connected && server.Connected)
            {
                try
                {
                    while (!closing && connected && serverStream != null && !serverStream.DataAvailable) ;
                }
                catch(Exception e)
                {
                    break;
                }

                if (closing) return;

                if (serverStream == null || !connected) break;

                byte[] bytes = new byte[server.Available];
                serverStream.Read(bytes, 0, bytes.Length);

                String inData = Encoding.UTF8.GetString(bytes);

                if (inData.StartsWith("\0"))
                {
                    //TODO server shutdown
                    Disconnect();
                    return;
                }

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
                    catch(Exception e)
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
                            currentProfile.id = profile.id;
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
                            updateAddPeer(oldPeer);
                            if (null != _onPeerRemoved)
                                _onPeerRemoved(oldPeer);
                            break;
                        case MessageType.Custom:
                            if (null != _onCustomDataRecieved)
                                _onCustomDataRecieved(message.data);
                            break;
                        case MessageType.Kinect:
                            KinectSkeleton skeleton = new KinectSkeleton();
                            skeleton = jSerializer.Deserialize<KinectSkeleton>(message.data);
                            processRemoteKinect(skeleton);
                            break;
                        default:
                            Debugger.Break();
                            break;
                    }
                }

                //serverStream.Write(responseBytes, 0, responseBytes.Length);
            }

            Disconnect();
            ConnectToServer();
            //reconnect

            goto handlerStart;
        }

        public void sendCustomData(string data)
        {
            SocketMessage message = new SocketMessage();
            message.type = MessageType.Custom;
            message.data = data;

            string json = jSerializer.Serialize(message) + "\0";
            byte[] bytes = Encoding.UTF8.GetBytes(json);

            if (serverStream != null && serverStream.CanWrite)
            {
                try
                {
                    serverStream.Write(bytes, 0, bytes.Length);
                }
                catch(System.IO.IOException e)
                {
                    Disconnect();
                }
            }
        }

        public void Reconnect()
        {
            if (serverThread == null)
                ConnectToServer();
            else
                connected = false;
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
            if (server != null)
            {
                if (serverStream != null)
                    serverStream.Close();
                server.Close();

                server = null;
                serverStream = null;
                serverReady = false;
            }
            connected = false;
            connectionChanged = true;
        }

        public void updateAppInfo(AppInfo newInfo)
        {
            currentApp = newInfo;

            SocketMessage message = new SocketMessage();

            if(null == newInfo)
            {
                //the app was closed
                message.type = MessageType.AppInfo;
                message.data = null;
            }
            else
            {
                //the app was connected
                message.type = MessageType.AppInfo;
                message.data = jSerializer.Serialize(newInfo);
            }

            string json = jSerializer.Serialize(message) + "\0";
            byte[] msgBytes = Encoding.UTF8.GetBytes(json);

            //tell server
            if(serverReady)
            {
                try
                {
                    serverStream.Write(msgBytes, 0, msgBytes.Length);
                }
                catch(System.IO.IOException e)
                {
                    Disconnect();
                }
                
            }
            else
            {
                //TODO how did we get to this state... 
                //retry connection?
                Reconnect();
            }
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

            string json = jSerializer.Serialize(message) + "\0";

            byte[] messageBytes = Encoding.UTF8.GetBytes(json);

            if (serverReady)
            {
                try
                {
                    serverStream.Write(messageBytes, 0, messageBytes.Length);
                }
                catch (System.IO.IOException e)
                {
                    Disconnect();
                }

            }
            else
            {
                //TODO how did we get to this state... 
                //retry connection?
                Reconnect();
            }
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

        public void updateLocalKinect(KinectSkeleton p1, KinectSkeleton p2)
        {
            if (this.currentApp == null)
                return;

            p1.stationID = this.currentProfile.id;
            p2.stationID = this.currentProfile.id;
            this.currentProfile.player1 = p1;
            this.currentProfile.player2 = p2;

            KinectSkeleton[] skeletons = { p1, p2 };
            foreach (KinectSkeleton s in skeletons)
            {
                SocketMessage msg = new SocketMessage();
                msg.type = MessageType.Kinect;
                msg.data = jSerializer.Serialize(s);

                string data = jSerializer.Serialize(msg);
                byte[] messageBytes = Encoding.UTF8.GetBytes(data + "\0");

                if (serverReady)
                {
                    try
                    {
                        serverStream.Write(messageBytes, 0, messageBytes.Length);
                    }
                    catch (Exception e)
                    {
                        Disconnect();
                    }

                }
                else
                {
                    //TODO how did we get to this state... 
                    //retry connection?
                    Reconnect();
                }
            }
        }

        void processRemoteKinect(KinectSkeleton remote)
        {
            foreach (StationProfile peer in currentPeers)
            {
                if (peer.id == remote.stationID)
                {
                    switch(remote.playerNumber)
                    {
                        case 1:
                            peer.player1 = remote;
                            break;
                        case 2:
                            peer.player2 = remote;
                            break;
                        default:
                            Debugger.Break();
                            return;
                    }
                    if (_onRemoteKinectRecieved != null)
                    {
                        _onRemoteKinectRecieved(remote);
                        newRemoteKinect = true;
                    }
                }
            }
        }
    }
}
