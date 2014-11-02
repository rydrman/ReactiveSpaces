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
        remoteKinect
    }

    class WebSocketMessage
    {
        public MessageType type = MessageType.Custom;
        public string data { get; set; }
    }

    class WebSocketSkeleton
    {
        public MessageType type = MessageType.Kinect;
        public KinectSkeleton data { get; set; }
    }

    class AppInfoMessage
    {
        public MessageType type = MessageType.AppInfo;

        public AppInfo data { get; set; }
    }
}
