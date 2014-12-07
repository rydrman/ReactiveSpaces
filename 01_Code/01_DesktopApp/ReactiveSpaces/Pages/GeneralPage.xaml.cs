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
using System.IO;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Formatters.Binary;

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

        public void Load()
        {
            //try to load settings
            if (File.Exists("local.bin"))
            {
                try
                {
                    using (FileStream fStream = File.OpenRead("local.bin"))
                    {
                        byte[] remoteBytes = new byte[fStream.Length];
                        fStream.Read(remoteBytes, 0, remoteBytes.Length);

                        BinaryFormatter formatter = new BinaryFormatter();
                        MemoryStream stream = new MemoryStream();
                        stream.Write(remoteBytes, 0, remoteBytes.Length);
                        stream.Seek(0, SeekOrigin.Begin);
                        serverInfo loadInfo = (serverInfo)formatter.Deserialize(stream);

                        currentPort = loadInfo.port;
                        apiPort.Text = currentPort.ToString("####");

                        if (_onPortChanged != null)
                            _onPortChanged(currentPort);
                    }
                }
                catch { }
            }
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

        public void OnClose()
        {
            try
            {
                using (FileStream fStream = File.OpenWrite("local.bin"))
                {
                    serverInfo toSave = new serverInfo();
                    toSave.port = currentPort;
                    toSave.host = "";

                    BinaryFormatter formatter = new BinaryFormatter();
                    MemoryStream stream = new MemoryStream();
                    formatter.Serialize(stream, toSave);
                    byte[] saveBytes = stream.ToArray();

                    fStream.Write(saveBytes, 0, saveBytes.Length);
                }
            }
            catch { }
        }
    }
}
