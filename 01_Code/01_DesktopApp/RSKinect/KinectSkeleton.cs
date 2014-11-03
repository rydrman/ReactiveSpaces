using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
//using System.Threading.Tasks;
using Microsoft.Kinect;
using System.Runtime.Serialization.Json;
using System.IO;
using System.Runtime.Serialization;

namespace RSKinect
{
    [Serializable()]
    public class Vector3
    {
        public float x { get; set; }
        public float y { get; set; }
        public float z { get; set; }

        public Vector3()
        {
            x = 0;
            y = 0;
            z = 0;
        }
        public Vector3(float _x, float _y, float _z)
        {
            x = _x;
            y = _y; 
            z = _z; 
        }
        public void Set(float _x, float _y, float _z)
        {
            x = _x;
            y = _y; 
            z = _z; 
        }
        public override string ToString()
        {
            return (String.Format("({0}, {1}, {2})", x, y, z));
        }
    }

    [Serializable()]
    public class KinectJoint
    {
        public KinectJoints jointType { get; set; }
        public Vector3 position { get; set; }
        public Vector3 screenPos { get; set; }
        public bool tracked { get; set; }

        public KinectJoint()
        {
            position = new Vector3();
            screenPos = new Vector3();
        }
    }

    public enum KinectJoints
    {
        //head
        HEAD,
        
        //torso
        SHOULDER_CENTER,
        SPINE,
        HIP_CENTER,

        //arms
        SHOULDER_LEFT,
        SHOULDER_RIGHT,
        ELBOW_LEFT,
        ELBOW_RIGHT,
        WRIST_LEFT,
        WRIST_RIGHT,
        HAND_LEFT,
        HAND_RIGHT,

        //legs
        HIP_LEFT,
        HIP_RIGHT,
        KNEE_LEFT,
        KNEE_RIGHT,
        ANKLE_LEFT,
        ANKLE_RIGHT,
        FOOT_LEFT,
        FOOT_RIGHT
    }

    [Serializable()]
    public class KinectSkeleton
    {
        public int numberOfJoints = 20;

        public bool upToDate {get; internal set;}
        public bool userPresent { get; internal set; }
        public int ID {get; private set;}
        public int playerNumber = 0;
        public int stationID = -1;

        [NonSerialized()]
        private KinectSensor sensor;

        //to store joints
        public KinectJoint[] joints { get; private set; }

        public KinectSkeleton() 
        {
            //upToDate = false;
            //userPresent = false;
            //ID = -1;

            sensor = null;

            joints = new KinectJoint[numberOfJoints];
            for (int i = 0; i < numberOfJoints; ++i)
            {
                joints[i] = new KinectJoint();
                //joints[i].tracked = false;
                //joints[i].jointType = (KinectJoints)i;
            }
        }

        public KinectSkeleton( KinectSensor _sensor )
        {
            upToDate = false;
            userPresent = false;
            ID = -1;

            sensor = _sensor;

            joints = new KinectJoint[numberOfJoints];
            for(int i = 0; i < numberOfJoints; ++i)
            {
                joints[i] = new KinectJoint();
                joints[i].tracked = false;
                joints[i].jointType = (KinectJoints)i;
            }
        }

        internal void copyDataFrom(Skeleton skeleton, int playerNum = 0)
        {
            ID = skeleton.TrackingId;
            playerNumber = playerNum;

            userPresent = skeleton.TrackingState == SkeletonTrackingState.Tracked;

            applyJoint(KinectJoints.HEAD, skeleton.Joints[JointType.Head]);

            applyJoint(KinectJoints.SHOULDER_CENTER, skeleton.Joints[JointType.ShoulderCenter]);
            applyJoint(KinectJoints.SPINE, skeleton.Joints[JointType.Spine]);
            applyJoint(KinectJoints.HIP_CENTER, skeleton.Joints[JointType.HipCenter]);

            applyJoint(KinectJoints.SHOULDER_LEFT, skeleton.Joints[JointType.ShoulderLeft]);
            applyJoint(KinectJoints.SHOULDER_RIGHT, skeleton.Joints[JointType.ShoulderRight]);
            applyJoint(KinectJoints.ELBOW_LEFT, skeleton.Joints[JointType.ElbowLeft]);
            applyJoint(KinectJoints.ELBOW_RIGHT, skeleton.Joints[JointType.ElbowRight]);
            applyJoint(KinectJoints.WRIST_LEFT, skeleton.Joints[JointType.WristLeft]);
            applyJoint(KinectJoints.WRIST_RIGHT, skeleton.Joints[JointType.WristRight]);
            applyJoint(KinectJoints.HAND_LEFT, skeleton.Joints[JointType.HandLeft]);
            applyJoint(KinectJoints.HAND_RIGHT, skeleton.Joints[JointType.HandRight]);

            applyJoint(KinectJoints.HIP_LEFT, skeleton.Joints[JointType.HipLeft]);
            applyJoint(KinectJoints.HIP_RIGHT, skeleton.Joints[JointType.HipRight]);
            applyJoint(KinectJoints.KNEE_LEFT, skeleton.Joints[JointType.KneeLeft]);
            applyJoint(KinectJoints.KNEE_RIGHT, skeleton.Joints[JointType.KneeRight]);
            applyJoint(KinectJoints.ANKLE_LEFT, skeleton.Joints[JointType.AnkleLeft]);
            applyJoint(KinectJoints.ANKLE_RIGHT, skeleton.Joints[JointType.AnkleRight]);
            applyJoint(KinectJoints.FOOT_LEFT, skeleton.Joints[JointType.FootLeft]);
            applyJoint(KinectJoints.FOOT_RIGHT, skeleton.Joints[JointType.FootRight]);
        }

        private void applyJoint(KinectJoints copyTo, Microsoft.Kinect.Joint copyFrom)
        {
            joints[(int)copyTo].tracked = (copyFrom.TrackingState != JointTrackingState.NotTracked);
            if (joints[(int)copyTo].tracked)
            {
                joints[(int)copyTo].position.Set(copyFrom.Position.X, copyFrom.Position.Y, copyFrom.Position.Z);
                DepthImagePoint point = sensor.CoordinateMapper.MapSkeletonPointToDepthPoint(copyFrom.Position, DepthImageFormat.Resolution320x240Fps30);
                joints[(int)copyTo].screenPos.Set(point.X * 0.003125f, point.Y * 0.0041667f, (float)Math.Min(copyFrom.Position.Z * 0.2, 1) );
            }
        }

        public string Serialize()
        {
            MemoryStream stream = new MemoryStream();
            DataContractJsonSerializer serializer = new DataContractJsonSerializer(typeof(KinectSkeleton));
            serializer.WriteObject(stream, this);

            return stream.ToString();
        }
    }

}
