using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
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

            networker = new Networker();
            localNet = new LocalNetworker(networker);

            kinectManager = new KinectManager();
            kinectManager.InitializeKinect(false, false, true);

            timer = new DispatcherTimer();
            timer.Tick += onTimerTick;
            timer.Interval = TimeSpan.FromSeconds(0.05);
            timer.Start();

            //set handlers
            generalPage._onSendButton = onSendMessage;

            //setup data
            networkPage._onReconnect = onReconnect;

            //navigate
            mainFrame.Navigate(generalPage);
        }

        private void onTimerTick(object sender, EventArgs e)
        {
            //networker stuff
            if (localNet.newAppInfo)
            {
                generalPage.updateAppInfo(localNet.appInfo);
                networker.updateAppInfo(localNet.appInfo);
                localNet.newAppInfo = false;
            }

            //remote stuff
            if(networker.connectionChanged)
            {
                networkPage.serverConnectionChanged(networker.connected);
                networker.connectionChanged = false;
            }

            //ui profile update
            if(networkPage.stationProfileUpdated)
            {
                networker.updateStationProfile(networkPage.currentProfile);
                networkPage.stationProfileUpdated = false;
            }

            //station profile
            if(networker.stationProfileUpdated)
            {
                networkPage.updateStationProfile(networker.currentProfile);
                networker.stationProfileUpdated = false;
            }

            //peer list
            if (networker.peerListUpdated)
            {
                networker.peerListUpdated = false;
                networkPage.updatePeerList(networker.currentPeers);
            }

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

                //send to peers
                //networker.PushKinectToPeers(kinectManager.playerOne, kinectManager.playerTwo);
            }
        }

        private void onSkeletonsUpdated()
        {
            
        }

        private void onCloseButtonClick(object sender, RoutedEventArgs e)
        {
            networker.Disconnect();
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
            //networker.RequestProfile();
        }

        #region Handlers to and from networker

        public void onReconnect()
        {
            localNet.Disconnect();
            networker.reconnect();
        }

        public void RecieveMessage(string msg)
        {
            generalPage.messageOutput.Text = msg;
        }

        public void RecieveKinect(List<StationProfile> peers)
        {
            kinectPage.drawRemoteSkeletons(peers);
        }

        public void ProfileChanged(StationProfile newProfile)
        {
            //networker.onProfileChanged(newProfile);
        }

        private void onSendMessage(string message)
        {
            //networker.SendMessage(message);
        }
        #endregion

        #region handlers to and from local networker

        public void onAppInfoUpdated(AppInfo newInfo)
        {
            generalPage.updateAppInfo(newInfo);
            networker.updateAppInfo(newInfo);
        }

        #endregion

        private void tabButtonClick(object sender, RoutedEventArgs e)
        {
            ToggleButton clicked = (ToggleButton)sender;
            switch(clicked.Name)
            {
                case "generalTabButton":
                    if (mainFrame.Content.GetType() != generalPage.GetType())
                        mainFrame.Navigate(generalPage);
                    clicked.IsChecked = true;
                    kinectTabButton.IsChecked = false;
                    networkTabButton.IsChecked = false;
                    break;
                case "kinectTabButton":
                    if (mainFrame.Content.GetType() != kinectPage.GetType())
                        mainFrame.Navigate(kinectPage);
                    clicked.IsChecked = true;
                    generalTabButton.IsChecked = false;
                    networkTabButton.IsChecked = false;
                    break;
                case "networkTabButton":
                    if (mainFrame.Content.GetType() != networkPage.GetType())
                        mainFrame.Navigate(networkPage);
                    clicked.IsChecked = true;
                    generalTabButton.IsChecked = false;
                    kinectTabButton.IsChecked = false;
                    break;
            }
        }

    }
}
