using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RSNetworker
{
    public class StationProfile
    {
        public string name { get; set; }
        public string location { get; set; }
        //TODO icon
        public int meshID { get; set; }

        public void Set(StationProfile newData)
        {
            name = newData.name;
            location = newData.location;
        }
    }
}
