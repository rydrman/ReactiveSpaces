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

        //data to show
        public StationProfile currentProfile;
        public List<StationProfile> currentPeers;
        AppInfo currentApp = null;

        JavaScriptSerializer jSerializer;

        TcpListener listener;
        Int32 listenerPort;
        Thread listenThread = null;

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

        public Networker()
        {
            currentProfile = new StationProfile();
            currentPeers = new List<StationProfile>();

            jSerializer = new JavaScriptSerializer();

            server = new TcpClient();
            SocketError result = ConnectToServer();

            if(result != SocketError.Success)
            {
                //connection not made
                Debugger.Break();
                return;
            }

            //listener = new TcpListener(IPAddress.Any, 0);
            //listenerPort = ((IPEndPoint)listener.LocalEndpoint).Port;
            //listener.Start();

            //listenThread = new Thread(WaitForConnection);
            //listenThread.Start();
        }

        private SocketError ConnectToServer()
        {
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

            //write station profile
            sendStationProfile();

            serverThread = new Task(ServerConnectionHandler);
            serverThread.Start();

            return SocketError.Success;
        }

        private void ServerConnectionHandler()
        {
            connected = true;
            connectionChanged = true;

            while(server.Connected)
            {
                try
                {
                    while (serverStream != null && !serverStream.DataAvailable) ;
                }
                catch(Exception e)
                {
                    break;
                }

                if (serverStream == null) return;

                byte[] bytes = new byte[server.Available];
                serverStream.Read(bytes, 0, bytes.Length);

                String inData = Encoding.UTF8.GetString(bytes);

                if (inData.StartsWith("\0"))
                {
                    //TODO server shutdown
                    Disconnect();
                    break;
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
                        default:
                            Debugger.Break();
                            break;
                    }
                }

                //serverStream.Write(responseBytes, 0, responseBytes.Length);
            }
            Disconnect();
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

        public void Disconnect()
        {
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
                serverStream.Write(msgBytes, 0, msgBytes.Length);
            }
            else
            {
                //TODO how did we get to this state... 
                //retry connection?
                Debugger.Break();
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

            if (serverStream != null)
                serverStream.Write(messageBytes, 0, messageBytes.Length);
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
    }
}
