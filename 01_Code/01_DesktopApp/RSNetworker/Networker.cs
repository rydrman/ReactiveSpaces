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
        ChannelFactory<IRSNetworker> channelFactory;
        IRSNetworker channel;

        //profile data
        int lastMeshID = 0;
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

        public void UpdateProfile(StationProfile newData)
        {
            foreach (StationProfile peer in currentPeers)
            {
                if (peer.meshID == newData.meshID)
                {
                    _onPeerUpdated(peer, newData);
                    peer.Set(newData);
                }
            }
        }

        public StationProfile getProfile()
        {
            return currentProfile;
        }

        public void onProfileChanged(StationProfile newProfile)
        {
            this.currentProfile = newProfile;
            channel.UpdateProfile(newProfile);
            //TODO tell others
        }

        public void RequestProfile()
        {
            channel.RegisterProfile(currentProfile);
        }

        public void RecieveKinect(KinectData newData)
        {

        }

        public void SendKinect(KinectSkeleton newSkeleton)
        {

        }

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

            //channel.RequestProfile();
            //PeerName name = new PeerName("ReactiveSpaces", PeerNameType.Unsecured);
            //PeerNameResolver resolver = new PeerNameResolver();
            
            channel.RegisterProfile(currentProfile);
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
    }
}
