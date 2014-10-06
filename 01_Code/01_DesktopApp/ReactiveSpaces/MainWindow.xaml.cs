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
using System.Windows.Threading;
using RSKinect;
using RSNetworker;

namespace ReactiveSpaces
{
    
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        //we need instances of RSkinect and RS networker
        Networker networker;
        KinectManager kinectManager;

        //for graphic updating
        DispatcherTimer timer;

        public MainWindow()
        {
            InitializeComponent();

            networker = new Networker(RecieveMessage, RecieveKinect);

            kinectManager = new KinectManager();
            kinectManager.InitializeKinect(false, false, true);

            timer = new DispatcherTimer();
            timer.Tick += onTimerTick;
            timer.Interval = TimeSpan.FromSeconds(0.1);
            timer.Start();
        }

        private void onTimerTick(object sender, EventArgs e)
        {
            if(kinectManager.isNewSkeletonFrame)
            {
                if(kinectManager.playerOne != null && kinectManager.playerOne.userPresent)
                    drawSkeletonOnCanvas(kinectManager.playerOne, kinectCanvas);
                if (kinectManager.playerOne != null && kinectManager.playerTwo.userPresent)
                    drawSkeletonOnCanvas(kinectManager.playerTwo, kinectCanvas);
                kinectManager.isNewSkeletonFrame = false;
            }
        }

        private void onSkeletonsUpdated()
        {
            
        }

        private void drawSkeletonOnCanvas(KinectSkeleton s, Canvas c)
        {
            c.Children.Clear();
            for (int i = 0; i < KinectSkeleton.NumberOfJoints; ++i)
            {
                Ellipse jointEllipse = new Ellipse();
                SolidColorBrush jointBrush = new SolidColorBrush();

                jointBrush.Color = Color.FromArgb(255, 255, 255, 255);
                jointEllipse.Fill = jointBrush;

                jointEllipse.Width = 2;
                jointEllipse.Height = 2;

                Canvas.SetLeft(jointEllipse, s.joints[i].screenPos.x * 320);
                Canvas.SetTop(jointEllipse, s.joints[i].screenPos.y * 240);

                c.Children.Add(jointEllipse);
            }
        }

        private void onCloseButtonClick(object sender, RoutedEventArgs e)
        {
            Application.Current.Shutdown(0);
        }

        private void onMinimizeButtonClick(object sender, RoutedEventArgs e)
        {
            WindowState = WindowState.Minimized;
        }

        private void onTitleBarMouseDown(object sender, MouseButtonEventArgs e)
        {
            this.DragMove();
        }

        public void RecieveMessage(string msg)
        {
            messageOutput.Text = msg;
        }

        public void RecieveKinect(KinectData newData)
        {

        }

        private void onSendButtonClicK(object sender, RoutedEventArgs e)
        {
            networker.SendMessage(System.Environment.MachineName + ": " + messageOutput.Text);
        }

    }
}
