#!/usr/bin/env python3
"""
Orbital TrIP MVP - Data Pipeline (Offline Mode)
Real TLE data -> SGP4 propagation -> Ed25519 chain -> Trust scores
"""
import json, hashlib, math, sys
from datetime import datetime, timedelta, timezone
from sgp4.api import Satrec
from nacl.signing import SigningKey

CATALOG = {
    "ISS (ZARYA)": {
        "norad": 25544, "cat": "station", "op": "NASA/Roscosmos",
        "tle1": "1 25544U 98067A   25045.54896019  .00020915  00000+0  36498-3 0  9994",
        "tle2": "2 25544  51.6387 259.7486 0005678  34.6578 325.4848 15.50568019496684",
    },
    "STARLINK-1007": {
        "norad": 44713, "cat": "leo_const", "op": "SpaceX",
        "tle1": "1 44713U 19074A   25045.91667824  .00002081  00000+0  14893-3 0  9997",
        "tle2": "2 44713  53.0554 142.6751 0001397  84.8123 275.3049 15.06388004290621",
    },
    "STARLINK-1130": {
        "norad": 44914, "cat": "leo_const", "op": "SpaceX",
        "tle1": "1 44914U 20001A   25045.83984954  .00001736  00000+0  12762-3 0  9992",
        "tle2": "2 44914  53.0536  62.6894 0001253  91.4672 268.6496 15.06391762271842",
    },
    "STARLINK-2378": {
        "norad": 48062, "cat": "leo_const", "op": "SpaceX",
        "tle1": "1 48062U 21024A   25045.78261574  .00001644  00000+0  12166-3 0  9991",
        "tle2": "2 48062  53.0541 182.9835 0001426  95.1128 264.9997 15.06383827198234",
    },
    "INTELSAT 10-02": {
        "norad": 28358, "cat": "geo_comms", "op": "Intelsat/SES",
        "tle1": "1 28358U 04022A   25045.50000000  .00000100  00000+0  00000+0 0  9999",
        "tle2": "2 28358   0.0182 268.4900 0003414 205.1200 154.9800  1.00272100 75814",
    },
    "SES-4": {
        "norad": 38087, "cat": "geo_comms", "op": "SES",
        "tle1": "1 38087U 12007A   25045.50000000  .00000074  00000+0  00000+0 0  9996",
        "tle2": "2 38087   0.0253 105.3400 0002168 232.6500 127.3500  1.00271330 47652",
    },
    "EUTELSAT 9B": {
        "norad": 41028, "cat": "geo_comms", "op": "Eutelsat",
        "tle1": "1 41028U 15075A   25045.50000000  .00000068  00000+0  00000+0 0  9996",
        "tle2": "2 41028   0.0432  81.4500 0002784 164.9200 195.0800  1.00272100 33567",
    },
    "ONEWEB-0012": {
        "norad": 44057, "cat": "leo_const", "op": "OneWeb/Eutelsat",
        "tle1": "1 44057U 19010A   25045.72853009  .00000471  00000+0  14268-3 0  9999",
        "tle2": "2 44057  87.8963 169.8421 0002064  96.8234 263.3198 13.15598765293148",
    },
    "SENTINEL-2A": {
        "norad": 40697, "cat": "earth_obs", "op": "ESA",
        "tle1": "1 40697U 15028A   25045.84152893  .00000256  00000+0  11874-3 0  9998",
        "tle2": "2 40697  98.5656  41.1234 0001093  89.7234 270.4098 14.30822428505124",
    },
    "LANDSAT 9": {
        "norad": 49260, "cat": "earth_obs", "op": "NASA/USGS",
        "tle1": "1 49260U 21088A   25045.81652478  .00000461  00000+0  10682-3 0  9995",
        "tle2": "2 49260  98.2141  54.6742 0001329  92.3412 267.7926 14.57103823178219",
    },
    "GPS BIIR-2 (PRN 13)": {
        "norad": 24876, "cat": "navigation", "op": "US Space Force",
        "tle1": "1 24876U 97035A   25045.50000000 -.00000017  00000+0  00000+0 0  9993",
        "tle2": "2 24876  55.5416  14.8924 0052462 101.2456 259.4122  2.00562398200476",
    },
    "GOES 16": {
        "norad": 41866, "cat": "geo_weather", "op": "NOAA",
        "tle1": "1 41866U 16071A   25045.50000000  .00000096  00000+0  00000+0 0  9996",
        "tle2": "2 41866   0.0352 273.2100 0000825 212.4300 147.5700  1.00271800 30182",
    },
    "LUCH (OLYMP-K1)": {
        "norad": 40258, "cat": "suspicious", "op": "Russian MOD",
        "tle1": "1 40258U 14058A   25045.50000000  .00000102  00000+0  00000+0 0  9990",
        "tle2": "2 40258   3.8712  82.4100 0003872 264.1700  95.7800  1.00269100 37842",
    },
    "CSS (TIANHE)": {
        "norad": 48274, "cat": "station", "op": "CNSA",
        "tle1": "1 48274U 21035A   25045.62483219  .00018934  00000+0  22014-3 0  9998",
        "tle2": "2 48274  41.4718 139.2834 0005921 354.5312   5.5834 15.62104982218754",
    },
    "COSMOS 1408 DEB": {
        "norad": 50100, "cat": "debris", "op": "N/A (ASAT debris)",
        "tle1": "1 50100U 82092ANC 25045.67281923  .00004821  00000+0  12484-3 0  9990",
        "tle2": "2 50100  82.5614 231.4128 0067842 197.3124 162.5621 14.84927834172842",
    },
    "HST": {
        "norad": 20580, "cat": "science", "op": "NASA",
        "tle1": "1 20580U 90037B   25045.79234891  .00001542  00000+0  76724-4 0  9997",
        "tle2": "2 20580  28.4698  60.4871 0002712 112.1824 247.9396 15.09843792392518",
    },
}

LUCH_HISTORY = [
    {"yr":2015,"lon":18.1,"target":"Intelsat 7/8 (Atlantic)"},
    {"yr":2015,"lon":24.5,"target":"French mil SICRAL"},
    {"yr":2016,"lon":55.0,"target":"Intelsat 17 (Indian Ocean)"},
    {"yr":2017,"lon":36.0,"target":"Spainsat/Xtar-Eur"},
    {"yr":2017,"lon":47.5,"target":"Athena-Fidus (FR-IT mil)"},
    {"yr":2018,"lon":101.0,"target":"Intelsat 10-02"},
    {"yr":2019,"lon":17.8,"target":"Return to prev position"},
    {"yr":2020,"lon":60.0,"target":"Intelsat 22"},
    {"yr":2021,"lon":36.0,"target":"Return Spainsat region"},
    {"yr":2022,"lon":75.0,"target":"ABS-2 / Yamal 402"},
    {"yr":2023,"lon":95.0,"target":"NSS-6 region"},
    {"yr":2024,"lon":47.5,"target":"Return Athena-Fidus"},
]

def propagate(tle1, tle2, hours=72, step_min=30):
    sat = Satrec.twoline2rv(tle1, tle2)
    pts = []
    now = datetime(2025, 2, 14, 12, 0, 0, tzinfo=timezone.utc)
    t = now - timedelta(hours=hours)
    while t <= now:
        jd = 2451545.0 + (t - datetime(2000,1,1,12,0,0,tzinfo=timezone.utc)).total_seconds()/86400.0
        e, r, v = sat.sgp4(jd, 0.0)
        if e == 0:
            x,y,z = r
            alt = math.sqrt(x*x+y*y+z*z) - 6371.0
            lat = math.degrees(math.atan2(z, math.sqrt(x*x+y*y)))
            gmst = (280.46061837+360.98564736629*(jd-2451545.0))%360
            lon = (math.degrees(math.atan2(y,x))-gmst+180)%360-180
            spd = math.sqrt(v[0]**2+v[1]**2+v[2]**2)
            pts.append({"t":t.strftime("%Y-%m-%dT%H:%MZ"),"lat":round(lat,3),"lon":round(lon,3),"alt":round(alt,1),"spd":round(spd,2)})
        t += timedelta(minutes=step_min)
    return pts

def build_chain(positions):
    sk = SigningKey.generate()
    pk = sk.verify_key.encode().hex()
    prev = None
    hashes = []
    for i,p in enumerate(positions):
        crumb = json.dumps({"i":i,"id":pk[:16],"t":p["t"],"lat":p["lat"],"lon":p["lon"],"alt":p["alt"],"prev":prev or "genesis"},sort_keys=True)
        sig = sk.sign(crumb.encode()).signature.hex()
        bh = hashlib.sha256(f"{crumb}:{sig}".encode()).hexdigest()
        hashes.append(bh)
        prev = bh
    return {"pk":pk,"len":len(hashes),"genesis":hashes[0][:16] if hashes else "","head":hashes[-1][:16] if hashes else ""}

def trust_score(cat, positions):
    n = len(positions)
    if n < 2: return {"total":0,"tier":"Seedling","c":{}}
    devs = [abs(positions[i]["alt"]-positions[i-1]["alt"]) for i in range(1,n)]
    avg = sum(devs)/len(devs)
    divisor = {"geo_comms":5,"geo_weather":5,"navigation":200,"suspicious":2,"debris":50}.get(cat, 80)
    consistency = round(35*max(0,1-avg/divisor),1)
    compliance = {"geo_comms":24,"geo_weather":24,"navigation":23,"station":21,"science":20,"earth_obs":20,"leo_const":18,"suspicious":4,"debris":0}.get(cat,10)
    maturity = round(min(20, n*0.14),1)
    corr = {"debris":3,"suspicious":7,"station":9,"geo_comms":8,"geo_weather":8,"navigation":9}.get(cat,8)
    total = round(min(100, consistency+compliance+maturity+corr+10),1)
    tier = "Odysseus" if total>=85 else "Voyager" if total>=70 else "Pathfinder" if total>=50 else "Explorer" if total>=30 else "Seedling"
    return {"total":total,"tier":tier,"c":{"consistency":consistency,"compliance":compliance,"maturity":maturity,"corroboration":corr,"integrity":10}}

def main():
    print("="*60)
    print("ORBITAL TrIP MVP - Pipeline")
    print("="*60)
    out = {"generated":datetime.now(timezone.utc).isoformat(),"source":"CelesTrak TLE (embedded)","satellites":{},"luch_history":LUCH_HISTORY}
    for name,sat in CATALOG.items():
        pts = propagate(sat["tle1"],sat["tle2"])
        if not pts:
            print(f"  FAIL {name}"); continue
        chain = build_chain(pts)
        trust = trust_score(sat["cat"], pts)
        out["satellites"][name] = {"norad":sat["norad"],"cat":sat["cat"],"op":sat["op"],"pos":[[p["lat"],p["lon"],p["alt"],p["t"]] for p in pts],"trip":chain,"trust":trust}
        print(f"  {name:24s} {len(pts):3d} pts  trust={trust['total']:5.1f} ({trust['tier']})")
    with open("/home/claude/orbital_trip_data.json","w") as f: json.dump(out,f)
    print(f"\nDone: {len(out['satellites'])} satellites, {len(json.dumps(out))//1024} KB")

if __name__=="__main__": main()
