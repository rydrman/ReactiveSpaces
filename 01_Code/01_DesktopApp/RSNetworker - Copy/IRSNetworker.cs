using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ServiceModel;
using System.Runtime.Serialization;
using RSKinect;


namespace RSNetworker
{
    [DataContract]
    public struct KinectData
    {
        [DataMember]
        int playerID;

        [DataMember]
        KinectSkeleton skeleton;
    }


    [ServiceContract()]
    public interface IRSNetworker
    {
        void SendMessage(string msg);

        [OperationContract(IsOneWay = true)]
        void RecieveMessage(string msg);


        [OperationContract(IsOneWay = true)]
        void RequestProfile();

        [OperationContract(IsOneWay = true)]
        void UpdateRegisterProfile(StationProfile profile);


        [OperationContract(IsOneWay = true)]
        void PushKinectToPeers(KinectSkeleton player1, KinectSkeleton player2);
        [OperationContract(IsOneWay = true)]
        void RecieveKinect(int meshID, KinectSkeleton player1, KinectSkeleton player2);


        [OperationContract(IsOneWay = true)]
        void InitializeMesh();

    }

    public delegate void onPeerAdded(StationProfile newPeer);
    public delegate void onPeerRemoved(StationProfile oldPeer);
    public delegate void onPeerUpdated(StationProfile oldData, StationProfile newData);

    public delegate void onKinectRecieved(List<StationProfile> updatedProfile);
    public delegate void onMessageRecieved(string msg);
}
