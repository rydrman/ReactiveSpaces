using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
//using Microsoft.ServiceModel.WebSockets;
//using System.ServiceModel.Description;
using RSKinect;
using RSNetworker;
//using System.ServiceModel;
using System.Net.Sockets;
using System.Net;
using System.Threading;
using System.Security.Cryptography;
using System.Web.Script.Serialization;
using System.Diagnostics;

namespace RSLocalhost
{
    public class LocalNetworker
    {
        public bool newAppInfo = false;
        public AppInfo appInfo = null;
        public bool connected = false;

        JavaScriptSerializer jSerializer;

        TcpListener listener;
        Thread listenThread = null;

        TcpClient client = null;
        NetworkStream stream = null;
        bool streamReady = false;

        public LocalNetworker()
        {
            jSerializer = new JavaScriptSerializer();

            listener = new TcpListener(IPAddress.Any, 8080);
            listener.Start();

            listenThread = new Thread(WaitForConnection);
            listenThread.Start();

        }

        private void WaitForConnection()
        {
        connectionStart:

            streamReady = false;
            client = listener.AcceptTcpClient();
            stream = client.GetStream();

            while(client.Connected)
            {
                while (!stream.DataAvailable);

                byte[] bytes = new byte[client.Available];
                stream.Read(bytes, 0, bytes.Length);

                String data = Encoding.UTF8.GetString(bytes);

                //do the handshake
                if (data.StartsWith("GET"))
                {
                    string response = "HTTP/1.1 101 Switching Protocols" + Environment.NewLine +
                                      "Connection: Upgrade" + Environment.NewLine +
                                      "Upgrade: websocket" + Environment.NewLine +
                                      "Sec-WebSocket-Accept: ";

                    int pos = data.IndexOf("Sec-WebSocket-Key");
                    if (pos == -1) break;
                    string key = data.Remove(0, pos);
                    key = key.Remove(0, 18);
                    key = key.Split(new char[]{'\r'}, 2)[0].Trim();

                    response += Convert.ToBase64String( 
                            SHA1.Create().ComputeHash(
                                Encoding.UTF8.GetBytes(
                                    key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
                                )
                            )
                        );
                    response += Environment.NewLine + Environment.NewLine;

                    byte[] responseBytes = Encoding.UTF8.GetBytes( response );

                    stream.Write(responseBytes, 0, responseBytes.Length);
                    streamReady = true;
                    connected = true;
                }
                else
                {
                    //check for connection close
                    if (bytes[0] != 129) //136 is proper close command
                    {
                        Disconnect();
                        goto connectionStart;
                    }

                    //decode the message
                    string indata = DecodeMassage(bytes);
                    WebSocketMessage message = jSerializer.Deserialize<WebSocketMessage>(indata);

                    //find the type
                    switch(message.type)
                    {
                        case MessageType.AppInfo:
                            appInfo = jSerializer.Deserialize<AppInfo>(message.data);
                            newAppInfo = true;
                            break;
                        default:
                            Debugger.Break();
                            break;
                    }

                }
            }
            Disconnect();
            goto connectionStart;
        }

        public void Disconnect()
        {
            if(client != null)
            {
                if(stream != null)
                    stream.Close();
                client.Close();

                client = null;
                stream = null;
                streamReady = false;
            }
            appInfo = null;
            connected = false;
            newAppInfo = true;
        }

        public void UpdateLocalKinect(KinectSkeleton newSkeleton)
        {
            if (!streamReady || client == null || !client.Connected)
                return;

            WebSocketSkeleton message = new WebSocketSkeleton();
            message.data = newSkeleton;

            string src = jSerializer.Serialize(message);
            byte[] msg = CreateMessage(src);

            try
            {
                stream.Write(msg, 0, msg.Length);
            }
            catch(Exception e)
            {
                int i = 0;
            }
            
        }

        //takes 4 DeriveBytes as Encoding keys
        private byte[] CreateMessage(string message)
        {
            byte[] msg = Encoding.UTF8.GetBytes(message);
            List<byte> output = new List<byte>();

            output.Add(129); //fin & opt code


            if(msg.Length <= 125)
            {
                output.Add( BitConverter.GetBytes( Convert.ToByte(msg.Length) )[0] );
            }
            else if(msg.Length <= Int16.MaxValue)
            {
                output.Add(126);
                byte[] lenBytes = BitConverter.GetBytes( Convert.ToInt16(msg.Length) );
                output.AddRange(lenBytes.Reverse());
            }
            else
            {
                output.Add(127);
                byte[] lenBytes = BitConverter.GetBytes( Convert.ToInt64(msg.Length) );
                output.AddRange(lenBytes.Reverse());
            }

            output.AddRange( msg );

            return output.ToArray();
        }

        private string DecodeMassage(byte[] src)
        {

            long length = src[1] - 128;
            int pos = 2;
            if (length == 126)
            {
                length = BitConverter.ToInt16(src, 2);
                pos = 4;
            }
            else if (length == 127)
            {
                length = BitConverter.ToInt64(src, 2);
                pos = 10;
            }

            //decode
            byte[] key = new byte[4] { src[pos], src[pos + 1], src[pos + 2], src[pos + 3] };
            pos += 4;
            byte[] decoded = new byte[src.Length - pos];
            for (int i = 0; i < src.Length - pos; ++i)
            {
                decoded[i] = (byte)(src[i + pos] ^ key[i % 4]);
            }
            return Encoding.UTF8.GetString(decoded);
        }

        ~LocalNetworker()
        {
        }
    }
}
