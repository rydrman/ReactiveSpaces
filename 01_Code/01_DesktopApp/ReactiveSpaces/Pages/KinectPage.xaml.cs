using System;
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

        public delegate void OnRefreshClick();
        public OnRefreshClick _onRefreshClick = null;

        public KinectPage()
        {
            InitializeComponent();
        }

        public void onRefreshClick(object sender, RoutedEventArgs e)
        {
            if(_onRefreshClick != null)
                _onRefreshClick();
        }

        public void setKinectStatus(string statusText, Brush color)
        {
            kinectStatus.Text = statusText;
            kinectStatus.Foreground = color;
        }

        public void drawLocalSkeletons(KinectSkeleton[] skeletons)
        {
            byte step = (byte)(255 / skeletons.Length);
            byte color = 0;
            localCanvas.Children.Clear();

            SolidColorBrush jointBrush = new SolidColorBrush();

            //jointBrush.Color = Color.FromArgb(color, color, color, 255);
            //jointBrush.Color = Colors.Black;
            jointBrush = (SolidColorBrush)(new BrushConverter().ConvertFrom("#14ccc1")); //green

            foreach (KinectSkeleton s in skeletons)
            {
                for (int i = 0; i < s.numberOfJoints; ++i)
                {
                    if (s.joints[i].screenPos.x > 1 || s.joints[i].screenPos.x < 0
                    || s.joints[i].screenPos.y > 1 || s.joints[i].screenPos.y < 0)
                        continue;

                    Ellipse jointEllipse = new Ellipse();
                    
                    jointEllipse.Fill = jointBrush;

                    jointEllipse.Width = 5;
                    jointEllipse.Height = 5;

                    Canvas.SetLeft(jointEllipse, s.joints[i].screenPos.x * localCanvas.Width);
                    Canvas.SetTop(jointEllipse, s.joints[i].screenPos.y * localCanvas.Height);

                    localCanvas.Children.Add(jointEllipse);
                }
                color += step;
            }
        }
        public void drawRemoteSkeletons(List<StationProfile> peers)
        {
            remoteCanvas.Children.Clear();
            foreach (StationProfile s in peers)
            {

                byte step = (byte)(255 / peers.Count);
                byte color = 0;

                foreach(KinectSkeleton p in s.players)
                {
                    if (!p.userPresent) continue;
                    drawRemoteSkeleton(p, Color.FromArgb(color, color, color, 255));
                }
                color += step;
            }
        }
        public void drawRemoteSkeleton(KinectSkeleton skeleton, Color color)
        {
            SolidColorBrush jointBrush = new SolidColorBrush();

            //jointBrush.Color = color;
            //jointBrush.Color = Colors.Black;
            jointBrush = (SolidColorBrush)(new BrushConverter().ConvertFrom("#14ccc1"));//green

            for (int i = 0; i < skeleton.numberOfJoints; ++i)
            {
                if (skeleton.joints[i].screenPos.x > 1 || skeleton.joints[i].screenPos.x < 0
                    || skeleton.joints[i].screenPos.y > 1 || skeleton.joints[i].screenPos.y < 0)
                    continue;

                Ellipse jointEllipse = new Ellipse();
     
                jointEllipse.Fill = jointBrush;

                jointEllipse.Width = 5;
                jointEllipse.Height = 5;

                Canvas.SetLeft(jointEllipse, skeleton.joints[i].screenPos.x * remoteCanvas.Width);
                Canvas.SetTop(jointEllipse, skeleton.joints[i].screenPos.y * remoteCanvas.Height);

                remoteCanvas.Children.Add(jointEllipse);
            }
        }
    }
}
