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
        PeerDisconnect
    }

    class SocketMessage
    {
        public MessageType type;

        public string data;
    }
}
