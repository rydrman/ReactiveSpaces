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
        PeerConnect,
        PeerUpdate,
        PeerDisconnect
    }

    class WebSocketMessage
    {
        public MessageType type = MessageType.Custom;
        public string data { get; set; }
    }
}
