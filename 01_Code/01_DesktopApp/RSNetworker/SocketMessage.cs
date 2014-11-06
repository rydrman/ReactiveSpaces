using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RSNetworker
{
    enum MessageType
    {
        AppInfo,
        StationProfile,
        PeerConnect,
        PeerUpdate,
        PeerDisconnect,
        Custom,
        Kinect,
        AddKinect,
        RemoveKinect,
    }

    class SocketMessage
    {
        public MessageType type;

        public string data;
    }
}
