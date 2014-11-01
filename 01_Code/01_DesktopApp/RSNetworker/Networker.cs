using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ServiceModel;
using System.Net.PeerToPeer;
using RSKinect;

namespace RSNetworker
{
    [ServiceBehavior(InstanceContextMode = InstanceContextMode.Single)]
    public class Networker : IRSNetworker
    {
        //handlers
        onKinectRecieved _onKinectRecieved = null;
        onMessageRecieved _onMessageRecieved = null;
        onPeerAdded _onPeerAdded = null;
        onPeerRemoved _onPeerRemoved = null;
        onPeerUpdated _onPeerUpdated = null;

        //for networking
        ServiceHost host = null;
        PeerNameResolver resolver;
        ChannelFactory<IRSNetworker> channelFactory;
        IRSNetworker channel;

        //profile data
        StationProfile currentProfile;
        List<StationProfile> currentPeers;

        public Networker(onMessageRecieved messageCallback, 
            onKinectRecieved kinectCallback,
            onPeerAdded peerAddCallback,
            onPeerRemoved peerRemovedCallback,
            onPeerUpdated peerUpdateCallback)
        {
            _onKinectRecieved = kinectCallback;
            _onMessageRecieved = messageCallback;
            _onPeerAdded = peerAddCallback;
            _onPeerRemoved = peerRemovedCallback;
            _onPeerUpdated = peerUpdateCallback;

            currentProfile = null;
            currentPeers = new List<StationProfile>();

            StartService();
        }

        public void SendMessage(string msg)
        {
            if (channel != null)
                channel.RecieveMessage(msg);
        }

        public void RecieveMessage(string msg)
        {
            _onMessageRecieved(msg);
        }

        #region registration and updating

        public void RegisterProfile(StationProfile profile)
        {
            //check for known peer
            foreach(StationProfile peer in currentPeers)
            {
                if (peer.name == profile.name
                    && peer.meshID == profile.meshID
                    && peer.location == profile.location)
                    return;
            }
            //check if it's me
            if (currentProfile != null
                && currentProfile.name == profile.name
                && currentProfile.meshID == profile.meshID
                && currentProfile.location == profile.location)
                return;

            //Add to list
            currentPeers.Add(profile);

            //update ui
            _onPeerAdded(profile);
        }

        public bool UpdateProfile(StationProfile newData)
        {
            foreach (StationProfile peer in currentPeers)
            {
                if (peer.meshID == newData.meshID)
                {
                    _onPeerUpdated(peer, newData);
                    peer.Set(newData);
                    return true;
                }
            }
            return false;
        }

        public void UpdateRegisterProfile(StationProfile profile)
        {
            if (!UpdateProfile(profile))
                RegisterProfile(profile);
        }

        public StationProfile getProfile()
        {
            return currentProfile;
        }

        public void onProfileChanged(StationProfile newProfile)
        {
            this.currentProfile = newProfile;
            channel.UpdateRegisterProfile(newProfile);
            //TODO tell others
        }

        public void RequestProfile()
        {
            channel.UpdateRegisterProfile(currentProfile);
        }

        #endregion

        #region Kinect Updating

        public void PushKinectToPeers(KinectSkeleton player1, KinectSkeleton player2)
        {
            channel.RecieveKinect(currentProfile.meshID, player1, player2);
        }

        public void RecieveKinect(int meshID, KinectSkeleton player1, KinectSkeleton player2)
        {
            if (IsMe(meshID)) return;

            foreach(StationProfile s in currentPeers)
            {
                if(s.meshID == meshID)
                {
                    s.player1 = player1;
                    s.player2 = player2;
                    _onKinectRecieved(currentPeers);
                    return;
                }
            }
        }

        #endregion

        public void InitializeMesh(){ }

        #region Functions for Creating Connections
        private void StartService()
        {
            host = new ServiceHost(this);
            host.Open();
            channelFactory = new ChannelFactory<IRSNetworker>("ReactiveSpacesEndpoint");
            channel = channelFactory.CreateChannel();

            channel.InitializeMesh();

            //register myself
            //assign myself an ID
            currentProfile = new StationProfile();
            currentProfile.name = System.Environment.MachineName;
            currentProfile.location = "some place";
            currentProfile.meshID = (System.Environment.MachineName + host.ChannelDispatchers.ElementAt(0).Listener.Uri).GetHashCode();

            PeerName peerName = new PeerName("ReactiveSpaces", PeerNameType.Unsecured);
            //register with cloud
            PeerNameRegistration peerReg = new PeerNameRegistration(peerName, 3030);
            peerReg.Data = currentProfile.ToBytes();
            peerReg.UseAutoEndPointSelection = true;
            peerReg.Start();


            //find peers
            resolver = new PeerNameResolver();
            PeerNameRecordCollection peers = resolver.Resolve(peerName);

            foreach(PeerNameRecord p in peers)
            {
                StationProfile profile = new StationProfile();
                profile.FromBytes(p.Data);
                UpdateRegisterProfile(profile);
            }


            

            //channel.RequestProfile();
            //PeerName name = new PeerName("ReactiveSpaces", PeerNameType.Unsecured);
            //PeerNameResolver resolver = new PeerNameResolver();
            
            channel.UpdateRegisterProfile(currentProfile);
            channel.RequestProfile();
        }

        public void StopService()
        {
            if (host != null)
            {
                //TODO send the disconnect message
                if(host.State != CommunicationState.Closed)
                {
                    channelFactory.Close();
                    host.Close();
                }
            }
        }

        #endregion

        private bool IsMe(int meshID)
        {
            return currentProfile.meshID == meshID;
        }
    }
}
