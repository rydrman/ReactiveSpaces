using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Runtime.Serialization.Formatters.Binary;
using System.IO;
using RSKinect;

namespace RSNetworker
{
    [Serializable()]
    public class AppInfo
    {
        public string name;
        public float version { get; set; }
        public int maxPeers;

        public AppInfo() { }

        public AppInfo(string _name, float _version, int _peers)
        {
            name = _name;
            version = _version;
            maxPeers = _peers;
        }
    }

    [Serializable()]
    public class StationProfile
    {
        public string name { get; set; }
        public string location { get; set; }
        public int id { get; set; }
        //TODO icon

        [NonSerialized()]
        public KinectSkeleton player1;
        [NonSerialized()]
        public KinectSkeleton player2;

        public StationProfile()
        {
            player1 = new KinectSkeleton();
            player2 = new KinectSkeleton();

            name = "Default Station Name";
            location = "Default Station Location";
            id = -1;
        }

        public void Set(StationProfile newData)
        {
            name = newData.name;
            location = newData.location;
            id = newData.id;
        }

        /*public byte[] ToBytes()
        {
            BinaryFormatter formatter = new BinaryFormatter();
            MemoryStream stream = new MemoryStream();
            formatter.Serialize(stream, this);
            return stream.ToArray();
        }

        public void FromBytes(byte[] bytes)
        {
            BinaryFormatter formatter = new BinaryFormatter();
            MemoryStream stream = new MemoryStream();
            stream.Write(bytes, 0, bytes.Length);
            stream.Seek(0, SeekOrigin.Begin);
            StationProfile profile = (StationProfile)formatter.Deserialize(stream);

            Set(profile);
        }*/
    }
}
