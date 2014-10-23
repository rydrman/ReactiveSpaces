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
using RSLocalhost;

namespace ReactiveSpaces
{
    
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        //pages
        GeneralPage generalPage;
        KinectPage kinectPage;
        NetworkPage networkPage;

        //we need instances of RSkinect and RS networker
        Networker networker;
        LocalNetworker localNet;
        KinectManager kinectManager;

        //for graphic updating
        DispatcherTimer timer;

        public MainWindow()
        {
            InitializeComponent();

            //create pages
            generalPage = new GeneralPage();
            kinectPage = new KinectPage();
            networkPage = new NetworkPage();

            localNet = new LocalNetworker();
            networker = new Networker(RecieveMessage, RecieveKinect, AddPeer, RemovePeer, UpdatePeer);

            kinectManager = new KinectManager();
            kinectManager.InitializeKinect(false, false, true);

            timer = new DispatcherTimer();
            timer.Tick += onTimerTick;
            timer.Interval = TimeSpan.FromSeconds(0.1);
            timer.Start();

            //set handlers
            generalPage._onSendButton = onSendMessage;
            networkPage._onProfileChanged = ProfileChanged;

            //setup data
            networkPage.setProfile(networker.getProfile());

            //navigate
            mainFrame.Navigate(generalPage);
        }

        private void onTimerTick(object sender, EventArgs e)
        {
            //if theres a new frame
            if(kinectManager.isNewSkeletonFrame)
            {
                //get the skeletons
                List<KinectSkeleton> skeletons = new List<KinectSkeleton>();
                skeletons.Add(kinectManager.playerOne);
                skeletons.Add(kinectManager.playerTwo);

                //draw them in the app
                kinectPage.drawLocalSkeletons(skeletons);
                kinectManager.isNewSkeletonFrame = false;

                //send to json locally
                localNet.UpdateLocalKinect(skeletons.ElementAt(0));

                //TODO send to peers
            }
        }

        private void onSkeletonsUpdated()
        {
            
        }

        private void onCloseButtonClick(object sender, RoutedEventArgs e)
        {
            networker.StopService();
            localNet.Disconnect();
            kinectManager.ReleaseKinect();
            Application.Current.Shutdown(0);
        }

        private void onMinimizeButtonClick(object sender, RoutedEventArgs e)
        {
            WindowState = WindowState.Minimized;
        }

        private void onTitleBarMouseDown(object sender, MouseButtonEventArgs e)
        {
            this.DragMove();
            networker.RequestProfile();
        }

        #region Handlers to and from networker

        public void RecieveMessage(string msg)
        {
            generalPage.messageOutput.Text = msg;
        }

        public void RecieveKinect(KinectData newData)
        {

        }

        public void ProfileChanged(StationProfile newProfile)
        {
            networker.onProfileChanged(newProfile);
        }

        public void AddPeer(StationProfile newPeer)
        {
            networkPage.addPeer(newPeer);
        }
        public void RemovePeer(StationProfile oldPeer)
        {
            networkPage.removePeer(oldPeer);
        }

        public void UpdatePeer(StationProfile oldData, StationProfile newData)
        {
            networkPage.updatePeer(oldData, newData);
        }

        private void onSendMessage(string message)
        {
            networker.SendMessage(message);
        }
        #endregion

        private void tabButtonClick(object sender, RoutedEventArgs e)
        {
            Button clicked = (Button)sender;
            switch(clicked.Name)
            {
                case "generalTabButton":
                    if (mainFrame.Content.GetType() != generalPage.GetType())
                        mainFrame.Navigate(generalPage);
                    break;
                case "kinectTabButton":
                    if (mainFrame.Content.GetType() != kinectPage.GetType())
                        mainFrame.Navigate(kinectPage);
                    break;
                case "networkTabButton":
                    if (mainFrame.Content.GetType() != networkPage.GetType())
                        mainFrame.Navigate(networkPage);
                    break;
            }
        }

    }
}
