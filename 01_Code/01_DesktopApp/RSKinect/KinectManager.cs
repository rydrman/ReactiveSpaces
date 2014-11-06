using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
//using System.Threading.Tasks;
using System.Windows.Media;
using Microsoft.Kinect;
using System.Diagnostics;

namespace RSKinect
{
    public class KinectManager
    {
        public static int SUPPORTED_PLAYERS = 2;

        public bool statusChanged = false;
        public bool connected = false;
        public string status = "";
        public Brush statusBrush = Brushes.Red;

        public delegate void OnPlayerOut(KinectSkeleton player);
        public delegate void OnPlayerIn(KinectSkeleton player);
        public OnPlayerIn _onPlayerIn = null;
        public OnPlayerOut _onPlayerOut = null;

        public bool colorStream {get; private set;}
        public bool depthStream { get; private set; }
        public bool skeletonStream { get; private set; }

        KinectSensor sensor = null;
        private ColorImageFrame lastColorFrame;
        private DepthImageFrame lastDepthFrame;
        private Skeleton[] lastSkeletons;

        public bool isNewColorFrame;
        public bool isNewDepthFrame;
        public bool isNewSkeletonFrame;

        //actual exposed skeletons
        public KinectSkeleton[] players { get; private set; }

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
            lastSkeletons = new Skeleton[6];

            players = new KinectSkeleton[SUPPORTED_PLAYERS];
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
                        //TODO
                        status = "Device In Use";
                        statusBrush = Brushes.Red;
                        return false;
                    }
                    for (int i = 0; i < players.Length; ++i)
                    {
                        players[i] = new KinectSkeleton( sensor );
                        players[i].playerNumber = i;
                    }

                    status = "Connected";
                    statusBrush = Brushes.Green;
                    connected = true;
                    statusChanged = true;
                    return true;
                }
                else
                {
                    sensor = KinectSensor.KinectSensors[0];
                    SetStatus(sensor.Status);
                }
                KinectSensor.KinectSensors.StatusChanged += SensorStatusChanged;
            }
            status = "No Devices Found";
            statusBrush = Brushes.Red;
            statusChanged = true;
            return false;
        }

        private void SensorStatusChanged(object sender, StatusChangedEventArgs e)
        {
            if (((KinectSensor)sender).UniqueKinectId == sensor.UniqueKinectId)
            {
                bool result = SetStatus(e.Status);
                statusChanged = true;
            }
            else if( sensor.Status != KinectStatus.Connected
                && ((KinectSensor)sender).Status == KinectStatus.Connected)
            {
                InitializeKinect(colorStream, depthStream, skeletonStream);
                statusChanged = true;
            }
        }

        private bool SetStatus(KinectStatus kStatus)
        {
            statusBrush = Brushes.Red;
            switch (kStatus)
            {
                case KinectStatus.Connected:
                    status = "Connected";
                    statusBrush = Brushes.Green;
                    connected = true;
                    return true;
                case KinectStatus.DeviceNotGenuine:
                    status = "Device Not Genuine";
                    break;
                case KinectStatus.DeviceNotSupported:
                    status = "Device Not Supported";
                    break;
                case KinectStatus.Error:
                    status = "Unknown Device Error";
                    break;
                case KinectStatus.Initializing:
                    status = "Device Initializing";
                    break;
                case KinectStatus.InsufficientBandwidth:
                    status = "Insufficient Bandwidth on USB";
                    break;
                case KinectStatus.NotPowered:
                    status = "Device Not Powered";
                    break;
                case KinectStatus.NotReady:
                    status = "Device Was Not Ready";
                    break;
                case KinectStatus.Undefined:
                    status = "Device Status Unknown";
                    break;
                case KinectStatus.Disconnected:
                    status = "Disconneted";
                    break;
            }
            return false;
        }

        public void ReleaseKinect()
        {
            if (sensor != null && sensor.IsRunning)
            {
                sensor.Stop();
                sensor = null;
            }
            status = "Disconnected";
            statusBrush = Brushes.Gray;
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

        void onSkeletonFrameReady(object sender, SkeletonFrameReadyEventArgs e)
        {
            
            using(SkeletonFrame newFrame = e.OpenSkeletonFrame())
            {
                if (newFrame == null) return;

                newFrame.CopySkeletonDataTo(lastSkeletons);

                //first set them to out of date
                foreach (KinectSkeleton s in players)
                {
                    s.upToDate = false;
                }

                //go through each skeleton
                foreach (Skeleton skeleton in lastSkeletons)
                {
                    //match with existing
                    foreach (KinectSkeleton s in players)
                    {
                        //tracked and tracked, update it
                        if (skeleton.TrackingId == s.ID
                            && s.userPresent && skeleton.TrackingState == SkeletonTrackingState.Tracked)
                        {
                            s.upToDate = true;
                            s.copyDataFrom(skeleton);
                            break;
                        }
                        //if it's going to untracked, fire event
                        else if (skeleton.TrackingId == s.ID
                            && s.userPresent && skeleton.TrackingState != SkeletonTrackingState.Tracked)
                        {
                            s.userPresent = false;
                            s.upToDate = true;
                            if (_onPlayerOut != null)
                                _onPlayerOut(s);
                            break;
                        }
                        //if it's going to tracked, fire event
                        else if (!s.userPresent && skeleton.TrackingState == SkeletonTrackingState.Tracked)
                        {
                            s.upToDate = true;
                            s.copyDataFrom(skeleton);
                            if (_onPlayerIn != null)
                                _onPlayerIn(s);
                            break;
                        }
                    }
                }
                //once more to check for lost skeletons
                foreach (KinectSkeleton s in players)
                {
                    //if it's still up to date we didn't see the ID and
                    //it's gone out of frame
                    if (s.userPresent && !s.upToDate)
                    {
                        s.userPresent = false;
                        s.upToDate = false;
                        if (_onPlayerOut != null)
                            _onPlayerOut(s);
                    }
                }
                isNewSkeletonFrame = true;
            }
            //Debug.WriteLine(string.Format("{0}, {1}, {2}, {3}, {4}, {5}", lastSkeletons[0].TrackingId, lastSkeletons[1].TrackingId, lastSkeletons[2].TrackingId, lastSkeletons[3].TrackingId, lastSkeletons[4].TrackingId, lastSkeletons[5].TrackingId));
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
