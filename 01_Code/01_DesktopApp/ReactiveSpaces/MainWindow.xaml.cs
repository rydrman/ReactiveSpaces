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
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        //we need instances of RSkinect and RS networker
        Networker networker;
        KinectManager kinectManager;

        public MainWindow()
        {
            InitializeComponent();

            networker = new Networker(RecieveMessage, RecieveKinect);
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
