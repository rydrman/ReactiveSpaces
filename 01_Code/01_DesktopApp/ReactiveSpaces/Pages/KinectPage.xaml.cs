﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;
using RSKinect;
using RSNetworker;

namespace ReactiveSpaces
{
    /// <summary>
    /// Interaction logic for Kinect.xaml
    /// </summary>
    public partial class KinectPage : Page
    {
        public KinectPage()
        {
            InitializeComponent();
        }

        public void drawLocalSkeletons(List<KinectSkeleton> skeletons)
        {
            byte step = (byte)(255 / skeletons.Count);
            byte color = 0;
            localCanvas.Children.Clear();
            foreach (KinectSkeleton s in skeletons)
            {
                for (int i = 0; i < s.numberOfJoints; ++i)
                {
                    Ellipse jointEllipse = new Ellipse();
                    SolidColorBrush jointBrush = new SolidColorBrush();

                    jointBrush.Color = Color.FromArgb(color, color, color, 255);
                    jointEllipse.Fill = jointBrush;

                    jointEllipse.Width = 5;
                    jointEllipse.Height = 5;

                    Canvas.SetLeft(jointEllipse, s.joints[i].screenPos.x * 320);
                    Canvas.SetTop(jointEllipse, s.joints[i].screenPos.y * 240);

                    localCanvas.Children.Add(jointEllipse);
                }
                color += step;
            }
        }
        public void drawRemoteSkeletons(List<StationProfile> peers)
        {
            foreach (StationProfile s in peers)
            {

                byte step = (byte)(255 / peers.Count);
                byte color = 0;
                
                remoteCanvas.Children.Clear();

                drawRemoteSkeleton(s.player1, Color.FromArgb(color, color, color, 255));
                drawRemoteSkeleton(s.player2, Color.FromArgb(color, color, color, 255));
                color += step;
            }
        }
        public void drawRemoteSkeleton(KinectSkeleton skeleton, Color color)
        {
            for (int i = 0; i < skeleton.numberOfJoints; ++i)
            {
                Ellipse jointEllipse = new Ellipse();
                SolidColorBrush jointBrush = new SolidColorBrush();

                jointBrush.Color = color;
                jointEllipse.Fill = jointBrush;

                jointEllipse.Width = 5;
                jointEllipse.Height = 5;

                Canvas.SetLeft(jointEllipse, skeleton.joints[i].screenPos.x * 320);
                Canvas.SetTop(jointEllipse, skeleton.joints[i].screenPos.y * 240);

                localCanvas.Children.Add(jointEllipse);
            }
        }
    }
}
