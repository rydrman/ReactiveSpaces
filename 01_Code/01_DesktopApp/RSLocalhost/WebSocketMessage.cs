using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using RSKinect;
using RSNetworker;

namespace RSLocalhost
{
    enum MessageType
    {
        AppInfo,
        Custom,
        Kinect,
        RemoteKinect,
        StationProfile,
        PeerConnect,
        PeerUpdate,
        PeerDisconnect,
        LocalPlayerEnter,
        LocalPlayerExit,
        RemotePlayerEnter,
        RemotePlayerExit,
        FeatureMissing
    }

    class WebSocketMessage
    {
        public MessageType type = MessageType.Custom;
        public string data { get; set; }
    }
}
