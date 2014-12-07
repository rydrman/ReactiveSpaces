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
using System.Threading;
using System.Text.RegularExpressions;

using RSNetworker;

namespace ReactiveSpaces
{
    /// <summary>
    /// Interaction logic for General.xaml
    /// </summary>
    public partial class GeneralPage : Page
    {
        public delegate void OnSendButton(string message);
        public delegate void OnPortChanged(int port);
        public OnPortChanged _onPortChanged = null;

        int currentPort = 8081;

        private bool connected = false;

        public GeneralPage()
        {
            InitializeComponent();
        }


        public void updateListenState(bool listening)
        {
            if(listening)
            {
                listenStatus.Text = "Listening";
                listenStatus.Foreground = (SolidColorBrush)(new BrushConverter().ConvertFrom("#14ccc1"));
            }
            else
            {
                listenStatus.Text = "Not Listening";
                listenStatus.Foreground = (SolidColorBrush)(new BrushConverter().ConvertFrom("#999")); ;
            }
        }

        public void updateAppInfo(AppInfo newInfo)
        {
            if(newInfo == null)
            {
                connected = false;
                appName.Text = "";
                appVersion.Text = "";
                maxPlayers.Text = "";
                appStatus.Text = "Disconnected";
                appStatus.Foreground = (SolidColorBrush)(new BrushConverter().ConvertFrom("#ff00d5"));//pink/red
            }
            else if(!connected)
            {
                connected = true;
                appName.Text = newInfo.name;
                appVersion.Text = newInfo.version.ToString("0.00");
                maxPlayers.Text = newInfo.maxPeers.ToString();
                appStatus.Text = "Connected";
                appStatus.Foreground = (SolidColorBrush)(new BrushConverter().ConvertFrom("#14ccc1")); //green
            }
        }

        public void onPortStatusChanged(bool success)
        {
            if (success)
                apiPort.Background = Brushes.White;
            else
                apiPort.Background = (SolidColorBrush)(new BrushConverter().ConvertFrom("#ff00d5"));//pink/red
        }

        public void onPortChanged(object sender, KeyEventArgs e)
        {
            //check if its valid
            if (e.Key == Key.Return)
            {
                Regex regex = new Regex("[0-9][0-9][0-9][0-9]"); //regex that matches disallowed text
                if( !regex.IsMatch(apiPort.Text) )
                {
                    apiPort.Text = currentPort.ToString("####");
                    return;
                }

                int newPort = Convert.ToInt16(apiPort.Text);
                currentPort = newPort;
                if (_onPortChanged != null)
                    _onPortChanged(newPort);
            }
            
        }

        public void onPortLostFocus(object sender, EventArgs e)
        {
            apiPort.Text = currentPort.ToString("####");
        }
    }
}
