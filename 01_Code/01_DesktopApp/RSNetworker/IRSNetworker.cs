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
        void RecieveKinect(KinectData newData);
        void SendKinect(KinectSkeleton newSkeleton);



    }

    public delegate void onKinectRecieved(KinectData newData);
    public delegate void onMessageRecieved(string msg);
}
