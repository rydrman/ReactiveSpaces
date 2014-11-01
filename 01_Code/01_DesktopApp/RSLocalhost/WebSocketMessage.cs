using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using RSKinect;

namespace RSLocalhost
{
    enum MessageType
    {
        Custom,
        Kinect,
        remoteKinect
    }

    class WebSocketMessage
    {
        public MessageType Type = MessageType.Custom;
        public string data { get; set; }
    }

    class WebSocketSkeleton
    {
        public MessageType type = MessageType.Kinect;
        public KinectSkeleton data { get; set; }
    }
}
