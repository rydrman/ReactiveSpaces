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
using System.Threading;

using RSNetworker;

namespace ReactiveSpaces
{
    /// <summary>
    /// Interaction logic for General.xaml
    /// </summary>
    public partial class GeneralPage : Page
    {
        public delegate void OnSendButton(string message);
        public OnSendButton _onSendButton = null;

        private bool connected = false;

        public GeneralPage()
        {
            InitializeComponent();
        }

        private void onSendButtonClicK(object sender, RoutedEventArgs e)
        {
            if (_onSendButton != null)
            {
                _onSendButton(System.Environment.MachineName + ": " + messageOutput.Text);
            }
        }

        public void updateAppInfo(AppInfo newInfo)
        {
            if(newInfo == null)
            {
                connected = false;
                appName.Text = "";
                appVersion.Text = "";
                appStatus.Text = "Disconnected";
                appStatus.Foreground = Brushes.Red;
            }
            else if(!connected)
            {
                connected = true;
                appName.Text = newInfo.name;
                appVersion.Text = newInfo.version.ToString();
                appStatus.Text = "Connected";
                appStatus.Foreground = Brushes.Green;
            }
        }
    }
}
