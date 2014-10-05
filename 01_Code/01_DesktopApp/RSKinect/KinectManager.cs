using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
//using System.Threading.Tasks;
using Microsoft.Kinect;

namespace RSKinect
{
    public class KinectManager
    {
        public bool colorStream {get; private set;}
        public bool depthStream { get; private set; }
        public bool skeletonStream { get; private set; }

        KinectSensor sensor = null;
        private ColorImageFrame lastColorFrame;
        private DepthImageFrame lastDepthFrame;
        private Skeleton[] lastSkeletons;

        public bool isNewColorFrame { get; private set; }
        public bool isNewDepthFrame { get; private set; }
        public bool isNewSkeletonFrame { get; private set; }

        //actual exposed skeletons
        public KinectSkeleton playerOne { get; private set; }
        public KinectSkeleton playerTwo { get; private set; }

        //exposed textures of image streams
        //public Texture2D colorFrame { get; private set; }
        //public Texture2D depthFrame { get; private set; }

        public KinectManager()
        {
            colorStream = false;
            depthStream = false;
            skeletonStream = false;
            lastColorFrame = null;
            lastDepthFrame = null;
            lastSkeletons = null;

            playerOne = new KinectSkeleton();
            playerTwo = new KinectSkeleton();
        }

        //attempts to access kinect
        //picks the first found sensor
        //returns false if failed, true if found
        public bool InitializeKinect(bool _colorStream, bool _depthStream, bool _skeletonStream)
        {
            if (KinectSensor.KinectSensors.Count > 0)
            {
                sensor = KinectSensor.KinectSensors.FirstOrDefault(s => s.Status == KinectStatus.Connected);

                if(sensor != null)
                {
                    if (_colorStream)
                    {
                        sensor.ColorStream.Enable();
                        sensor.ColorFrameReady += onColorFrameReady;
                        colorStream = true;
                    }
                    if (_depthStream)
                    {
                        sensor.DepthStream.Enable();
                        sensor.DepthFrameReady += onDepthFrameReady;
                        depthStream = true;
                    }
                    if (_skeletonStream)
                    {
                        sensor.SkeletonStream.Enable();
                        sensor.SkeletonFrameReady += onSkeletonFrameReady;
                        skeletonStream = true;
                    }

                    try
                    {
                        sensor.Start();
                    }
                    catch(System.IO.IOException)
                    {
                        //another app is trying to read the data
                        Console.Write("App Conflict");
                        return false;
                    }
                    return true;
                }
            }
            return false;
        }

        public void Update()
        {
            //skeleton data update
            if(skeletonStream && isNewSkeletonFrame)
            {
                //first pass
                for(var i = 0 ; i < 6; ++i)
                {
                    if (playerOne.upToDate == false 
                        && lastSkeletons[i].TrackingId == playerOne.ID)
                    {
                        playerOne.copyDataFrom(lastSkeletons[i]);
                    }
                    else if (playerTwo.upToDate == false 
                        && lastSkeletons[i].TrackingId == playerTwo.ID)
                    {
                        playerTwo.copyDataFrom(lastSkeletons[i]);
                    }
                }
                //second pass fo updating
                for (var i = 0; i < 6; ++i)
                {
                    if (playerOne.upToDate == false
                        && lastSkeletons[i].TrackingState == SkeletonTrackingState.Tracked
                        && lastSkeletons[i].TrackingId != playerTwo.ID)
                    {
                        playerOne.copyDataFrom(lastSkeletons[i]);
                    }
                    else if (playerOne.upToDate == false
                        && lastSkeletons[i].TrackingState == SkeletonTrackingState.Tracked
                        && lastSkeletons[i].TrackingId != playerOne.ID)
                    {
                        playerTwo.copyDataFrom(lastSkeletons[i]);
                    }
                }
            }
        }


        /*public void ApplyColorData(Texture2D texture)
        {
            if (lastColorFrame != null)
            {
                byte[] pixels = new byte[lastColorFrame.PixelDataLength];
                lastColorFrame.CopyPixelDataTo(pixels);
                texture.LoadImage(pixels);
            }
        }
        public void ApplyDepthData(Texture2D texture)
        {
            if (lastDepthFrame != null)
            {
                short[] pixels = new short[lastDepthFrame.PixelDataLength];
                lastDepthFrame.CopyPixelDataTo(pixels);
                //texture.LoadImage(pixels);
            }
        }*/
        public bool UpdateSkeleton(KinectSkeleton skeleton)
        {
            if (lastSkeletons != null)
            {
                for(var i = 0; i < 6; ++i)
                {
                    if(lastSkeletons[i].TrackingId == skeleton.ID)
                    {
                        skeleton.copyDataFrom(lastSkeletons[i]);
                        return true;
                    }
                }
            }
            return false;
        }

        void onSkeletonFrameReady(object sender, SkeletonFrameReadyEventArgs e)
        {
            using(SkeletonFrame newFrame = e.OpenSkeletonFrame())
            {
                if (newFrame == null) return;

                newFrame.CopySkeletonDataTo(lastSkeletons);
                isNewSkeletonFrame = true;
                playerOne.upToDate = false;
                playerTwo.upToDate = false;
            }
        }
        void onDepthFrameReady(object sender, DepthImageFrameReadyEventArgs e)
        {
            using(DepthImageFrame newFrame = e.OpenDepthImageFrame())
            {
                if (newFrame == null) return;

                lastDepthFrame = newFrame;
                isNewDepthFrame = true;
            }
        }
        void onColorFrameReady(object sender, ColorImageFrameReadyEventArgs e)
        {
            using(ColorImageFrame newFrame = e.OpenColorImageFrame())
            {
                if (newFrame == null) return;

                lastColorFrame = newFrame;
                isNewColorFrame = true;
            }
        }

        public void StopKinect()
        {
            if (sensor == null) return;

            sensor.Stop();

        }
    }
}
