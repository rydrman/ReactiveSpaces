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
using System.Collections.ObjectModel;
using System.Text.RegularExpressions;
using RSNetworker;

namespace ReactiveSpaces
{
    /// <summary>
    /// Interaction logic for Network.xaml
    /// </summary>

    public partial class NetworkPage : Page
    {
        public bool stationProfileUpdated = false;
        public StationProfile currentProfile = null;

        public delegate void OnReconnect();
        public OnReconnect _onReconnect = null;

        public delegate void OnURLChanged(string url, int port);
        public OnURLChanged _onURLChanged = null;

        int currentPort = 8080;
        string currentURL = "http://reactivespacesapi.com";

        ObservableCollection<StationProfile> peers;
        public NetworkPage()
        {
            InitializeComponent();

            peers = new ObservableCollection<StationProfile>();
            connectedStations.ItemsSource = peers;
            //connectedStations.DataContext = peers;
        }

        public void serverConnectionChanged(bool connected)
        {
            if(connected)
            {
                serverStatus.Text = "Connected";
                serverStatus.Foreground = (SolidColorBrush)(new BrushConverter().ConvertFrom("#14ccc1")); //green
                return;
            }
            serverStatus.Text = "Disconnected";
            serverStatus.Foreground = (SolidColorBrush)(new BrushConverter().ConvertFrom("#ff00d5"));//pink/red
        }

        private void onConnectClick(object sender, RoutedEventArgs e)
        {
            if (_onReconnect != null)
                _onReconnect();
        }

        public void updateStationProfile(StationProfile current)
        {
            currentName.Text = current.name;
            currentLocation.Text = current.location;
            currentSessionID.Text = current.id.ToString();
            currentProfile = current;
        }

        public void onProfileChanged(object sender, KeyEventArgs e)
        {
            if (currentProfile == null) return;
            if (currentName.Text == "") currentName.Text = currentProfile.name;
            if (currentLocation.Text == "") currentLocation.Text = currentProfile.location;

            if (e.Key == Key.Return)
            {
                currentProfile.name = currentName.Text;
                currentProfile.location = currentLocation.Text;
                stationProfileUpdated = true;
            }
        }

        public void onProfileLostFocus(object sender, EventArgs e)
        {
            currentName.Text = currentProfile.name;
            currentLocation.Text = currentProfile.location;
        }

        public void updatePeerList(List<StationProfile> newData)
        {
            peers.Clear();
            foreach(StationProfile p in newData)
            {
                peers.Add(p);
            }
        }

        public void OnURLStatusChanged(bool success)
        {
            if (success)
            {
                serverURL.Background = Brushes.White;
                serverPort.Background = Brushes.White;
            }
            else
            {
                serverURL.Background = (SolidColorBrush)(new BrushConverter().ConvertFrom("#ff00d5"));//pink/red
                serverPort.Background = (SolidColorBrush)(new BrushConverter().ConvertFrom("#ff00d5"));//pink/red
            }
        }

        public void OnPortChanged(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Return)
            {
                Regex regex = new Regex("[0-9][0-9][0-9][0-9]"); //regex that matches disallowed text
                if (!regex.IsMatch(serverPort.Text))
                {
                    serverPort.Text = currentPort.ToString("####");
                    return;
                }

                int newPort = Convert.ToInt16(serverPort.Text);
                currentPort = newPort;
                if (_onURLChanged != null)
                    _onURLChanged(currentURL, currentPort);
            }
        }

        public void OnURLUserChanged(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Return)
            {
                currentURL = serverURL.Text;

                if (_onURLChanged != null)
                    _onURLChanged(currentURL, currentPort);
            }
        }

    }
}
