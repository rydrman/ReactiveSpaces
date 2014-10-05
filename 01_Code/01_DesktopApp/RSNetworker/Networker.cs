using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ServiceModel;
using RSKinect;

namespace RSNetworker
{
    [ServiceBehavior(InstanceContextMode = InstanceContextMode.Single)]
    public class Networker : IRSNetworker
    {
        onKinectRecieved _onKinectRecieved = null;
        onMessageRecieved _onMessageRecieved = null;

        ServiceHost host = null;
        ChannelFactory<IRSNetworker> channelFactory;
        IRSNetworker channel;

        public Networker(onMessageRecieved messageCallback, onKinectRecieved kinectCallback)
        {
            _onKinectRecieved = kinectCallback;
            _onMessageRecieved = messageCallback;

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

        public void RecieveKinect(KinectData newData)
        {

        }

        public void SendKinect(KinectSkeleton newSkeleton)
        {

        }

        #region Functions for Creating Connections
        private void StartService()
        {
            host = new ServiceHost(this);
            host.Open();// (TimeSpan.FromHours(1.0));
            channelFactory = new ChannelFactory<IRSNetworker>("ReactiveSpacesEndpoint");
            channel = channelFactory.CreateChannel();

            channel.SendMessage(System.Environment.MachineName + " is connected");
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
