using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
//using System.Threading.Tasks;
using Microsoft.Kinect;

namespace RSKinect
{
    public struct Vector3
    {
        float x;
        float y;
        float z;
        public Vector3(float _x, float _y, float _z)
        {
            x = (_x == null) ? 0 : _x;
            y = (_y == null) ? 0 : _y; 
            z = (_z == null) ? 0 : _z; 
        }
        public void Set(float _x, float _y, float _z)
        {
            x = (_x == null) ? 0 : _x;
            y = (_y == null) ? 0 : _y; 
            z = (_z == null) ? 0 : _z; 
        }
        public override string ToString()
        {
            return (String.Format("({0}, {1}, {2})", x, y, z));
        }
    }
    public struct KinectJoint
    {
        public Vector3 position;
        public bool tracked;
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

    public class KinectSkeleton
    {
        public static int NumberOfJoints = 20;

        public bool upToDate {get; internal set;}
        public bool userPresent { get; internal set; }
        public int ID {get; private set;}

        //to store joints
        public KinectJoint[] joints { get; private set; }

        public KinectSkeleton()
        {
            upToDate = false;
            userPresent = false;
            ID = -1;

            for(int i = 0; i < NumberOfJoints; ++i)
            {
                joints[i].tracked = false;
            }
        }
    
        internal void copyDataFrom(Skeleton skeleton)
        {
            ID = skeleton.TrackingId;

            userPresent = skeleton.TrackingState == SkeletonTrackingState.Tracked;

            applyJoint(joints[(int)KinectJoints.HEAD], skeleton.Joints[JointType.Head]);

            applyJoint(joints[(int)KinectJoints.SHOULDER_CENTER], skeleton.Joints[JointType.ShoulderCenter]);
            applyJoint(joints[(int)KinectJoints.SPINE], skeleton.Joints[JointType.Spine]);
            applyJoint(joints[(int)KinectJoints.HIP_CENTER], skeleton.Joints[JointType.HipCenter]);

            applyJoint(joints[(int)KinectJoints.SHOULDER_LEFT], skeleton.Joints[JointType.ShoulderLeft]);
            applyJoint(joints[(int)KinectJoints.SHOULDER_RIGHT], skeleton.Joints[JointType.ShoulderRight]);
            applyJoint(joints[(int)KinectJoints.ELBOW_LEFT], skeleton.Joints[JointType.ElbowLeft]);
            applyJoint(joints[(int)KinectJoints.ELBOW_RIGHT], skeleton.Joints[JointType.ElbowRight]);
            applyJoint(joints[(int)KinectJoints.WRIST_LEFT], skeleton.Joints[JointType.WristLeft]);
            applyJoint(joints[(int)KinectJoints.WRIST_RIGHT], skeleton.Joints[JointType.WristRight]);
            applyJoint(joints[(int)KinectJoints.HAND_LEFT], skeleton.Joints[JointType.HandLeft]);
            applyJoint(joints[(int)KinectJoints.HAND_RIGHT], skeleton.Joints[JointType.HandRight]);

            applyJoint(joints[(int)KinectJoints.HIP_LEFT], skeleton.Joints[JointType.HipLeft]);
            applyJoint(joints[(int)KinectJoints.HIP_RIGHT], skeleton.Joints[JointType.HipRight]);
            applyJoint(joints[(int)KinectJoints.KNEE_LEFT], skeleton.Joints[JointType.KneeLeft]);
            applyJoint(joints[(int)KinectJoints.KNEE_RIGHT], skeleton.Joints[JointType.KneeRight]);
            applyJoint(joints[(int)KinectJoints.ANKLE_LEFT], skeleton.Joints[JointType.AnkleLeft]);
            applyJoint(joints[(int)KinectJoints.ANKLE_RIGHT], skeleton.Joints[JointType.AnkleRight]);
            applyJoint(joints[(int)KinectJoints.FOOT_LEFT], skeleton.Joints[JointType.FootLeft]);
            applyJoint(joints[(int)KinectJoints.FOOT_RIGHT], skeleton.Joints[JointType.FootRight]);
        }

        private void applyJoint(KinectJoint copyTo, Microsoft.Kinect.Joint copyFrom)
        {
            copyTo.tracked = (copyFrom.TrackingState != JointTrackingState.NotTracked);
            if(copyTo.tracked)
                copyTo.position.Set(copyFrom.Position.X, copyFrom.Position.Y, copyFrom.Position.Z);
        }
    }

}
