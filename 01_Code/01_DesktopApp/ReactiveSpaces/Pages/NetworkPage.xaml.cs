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
using RSNetworker;

namespace ReactiveSpaces
{
    /// <summary>
    /// Interaction logic for Network.xaml
    /// </summary>

    public partial class NetworkPage : Page
    {
        public delegate void ProfileChanged(StationProfile newProfile);
        public ProfileChanged _onProfileChanged = null;
        StationProfile currentProfile = null;

        ObservableCollection<StationProfile> peers;
        public NetworkPage()
        {
            InitializeComponent();

            peers = new ObservableCollection<StationProfile>();
            connectedStations.ItemsSource = peers;
            //connectedStations.DataContext = peers;
        }

        private void onConnectClick(object sender, RoutedEventArgs e)
        {
            //TODO
        }

        public void setProfile(StationProfile current)
        {
            currentName.Text = current.name;
            currentLocation.Text = current.location;
            currentMeshID.Text = current.meshID.ToString();
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
                _onProfileChanged(currentProfile);
            }
        }

        public void onProfileLostFocus(object sender, EventArgs e)
        {
            currentName.Text = currentProfile.name;
            currentLocation.Text = currentProfile.location;
        }

        public void addPeer(StationProfile peer)
        {
            peers.Add(peer);
        }
        public void removePeer(StationProfile peer)
        {

        }

        public void updatePeer(StationProfile oldData, StationProfile newData)
        {
            foreach(StationProfile p in peers)
            {
                if(p.meshID == oldData.meshID
                    && p.name == oldData.name)
                {
                    p.Set(newData);
                }
            }
        }

    }
}
