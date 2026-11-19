import { useState, useEffect } from "react";
import { getCitiesApi, getPopularCitiesApi } from "../utils/api";
import "./Navbar.css";

const allCities = [
  "Ahmedabad",
  "Agra",
  "Ajmer",
  "Aligarh",
  "Amritsar",
  "Bengaluru",
  "Bhopal",
  "Bhubaneswar",
  "Bareilly",
  "Bilaspur",
  "Chennai",
  "Chandigarh",
  "Coimbatore",
  "Cuttack",
  "Chittoor",
  "Delhi-NCR",
  "Dhanbad",
  "Durgapur",
  "Dehradun",
  "Darjeeling",
  "Erode",
  "Eluru",
  "Etawah",
  "Etah",
  "Ernakulam",
  "Faridabad",
  "Firozabad",
  "Faizabad",
  "Fatehpur",
  "Fazilka",
  "Guwahati",
  "Gwalior",
  "Gandhinagar",
  "Ghaziabad",
  "Guntur",
  "Hyderabad",
  "Hubli",
  "Hisar",
  "Hazaribagh",
  "Haldwani",
  "Indore",
  "Itanagar",
  "Imphal",
  "Ichalkaranji",
  "Idukki",
  "Jaipur",
  "Jodhpur",
  "Jamshedpur",
  "Jhansi",
  "Jalandhar",
  "Kanpur",
  "Kolkata",
  "Kochi",
  "Kota",
  "Kurnool",
  "Lucknow",
  "Ludhiana",
  "Latur",
  "Leh",
  "Lakshadweep",
  "Mumbai",
  "Madurai",
  "Mysuru",
  "Meerut",
  "Moradabad",
  "Nagpur",
  "Nashik",
  "Noida",
  "Nellore",
  "Nizamabad",
  "Ongole",
  "Orai",
  "Osmanabad",
  "Ottapalam",
  "Ooty",
  "Patna",
  "Pune",
  "Panaji",
  "Porbandar",
  "Palakkad",
  "Quilon (Kollam)",
  "Qadian",
  "Qasimpur",
  "Qutubullapur",
  "Quarry Towns",
  "Ranchi",
  "Rajkot",
  "Raipur",
  "Rourkela",
  "Ratnagiri",
  "Surat",
  "Shimla",
  "Siliguri",
  "Srinagar",
  "Secunderabad",
  "Thiruvananthapuram",
  "Tirupati",
  "Tiruchirappalli",
  "Thrissur",
  "Tezpur",
  "Udaipur",
  "Ujjain",
  "Unnao",
  "Ulhasnagar",
  "Una",
  "Varanasi",
  "Vadodara",
  "Vijayawada",
  "Visakhapatnam",
  "Valsad",
  "Warangal",
  "Wardha",
  "Washim",
  "Wayanad",
  "West Delhi",
  "Xeldem (Goa)",
  "Xavier Nagar",
  "Xalapur",
  "Wokha",
  "Wardha",
  // Additional cities requested
  "Anand",
  "Ambala",
  "Amreli",
  "Anantapur",
  "Arrah",
  "Ballari",
  "Bardhaman",
  "Bhavnagar",
  "Bharuch",
  "Baramati",
  "Chikmagalur",
  "Chhatarpur",
  "Churu",
  "Chandrapur",
  "Chiplun",
  "Diu",
  "Dhar",
  "Dausa",
  "Dholpur",
  "Daman",
  "Ellenabad",
  "Ettumanoor",
  "Eklahare",
  "Eloor",
  "Edayarpalayam",
  "Fatehgarh Sahib",
  "Fatehabad",
  "Fatehnagar",
  "Fatehpur Sikri",
  "Farrukhabad",
  "Gir Somnath",
  "Gadag",
  "Gaya",
  "Gondia",
  "Gulbarga",
  "Hamirpur",
  "Hoshangabad",
  "Hingoli",
  "Himmatnagar",
  "Hansi",
  "Ichhapur",
  "Idar",
  "Islampur",
  "Irinjalakuda",
  "Itarsi",
  "Junagadh",
  "Jamnagar",
  "Jalgaon",
  "Jagdalpur",
  "Jhunjhunu",
  "Kheda",
  "Kalyan",
  "Kanchipuram",
  "Karaikudi",
  "Kargil",
  "Lonavala",
  "Lakhimpur",
  "Lalitpur",
  "Lohardaga",
  "Lunglei",
  "Morbi",
  "Mandya",
  "Munger",
  "Mahesana",
  "Mandi",
  "Navsari",
  "Nanded",
  "Nalgonda",
  "Neemuch",
  "Nainital",
  "Orchha",
  "Osian",
  "Okha",
  "Ozar",
  "Ongpura",
  "Pali",
  "Parbhani",
  "Pithoragarh",
  "Puducherry",
  "Palwal",
  "Qila Raipur",
  "Qutubullapur",
  "Qadian",
  "Quilandy",
  "Qasba",
  "Rewa",
  "Rohtak",
  "Rae Bareli",
  "Ramanathapuram",
  "Rishikesh",
  "Sangli",
  "Satara",
  "Sambalpur",
  "Sikar",
  "Sonipat",
  "Tumakuru",
  "Tonk",
  "Tinsukia",
  "Thriprayar",
  "Tadepalligudem",
  "Udgir",
  "Unao",
  "Uklana",
  "Uran",
  "Upleta",
  "Valsad",
  "Virar",
  "Vapi",
  "Viluppuram",
  "Vikarabad",
  "Wani",
  "Wankaner",
  "Wanaparthy",
  "Wokha",
  "Wardha",
];

const popularCities = [
  "Mumbai",
  "Delhi-NCR",
  "Bengaluru",
  "Chennai",
  "Pune",
  "Hyderabad",
  "Kolkata",
  "Ahmedabad",
  "Rajkot",
  "Surat",
  "Vadodara",
  "Jaipur",
  "Lucknow",
  "Indore",
  "Chandigarh",
  "Goa",
];

const cityStateMap = {
  Ahmedabad: "Gujarat",
  Agra: "Uttar Pradesh",
  Ajmer: "Rajasthan",
  Aligarh: "Uttar Pradesh",
  Amritsar: "Punjab",
  Bengaluru: "Karnataka",
  Bhopal: "Madhya Pradesh",
  Bhubaneswar: "Odisha",
  Bareilly: "Uttar Pradesh",
  Bilaspur: "Chhattisgarh",
  Chennai: "Tamil Nadu",
  Chandigarh: "Chandigarh",
  Coimbatore: "Tamil Nadu",
  Cuttack: "Odisha",
  Chittoor: "Andhra Pradesh",
  "Delhi-NCR": "Delhi",
  Dhanbad: "Jharkhand",
  Durgapur: "West Bengal",
  Dehradun: "Uttarakhand",
  Darjeeling: "West Bengal",
  Erode: "Tamil Nadu",
  Eluru: "Andhra Pradesh",
  Etawah: "Uttar Pradesh",
  Etah: "Uttar Pradesh",
  Ernakulam: "Kerala",
  Faridabad: "Haryana",
  Firozabad: "Uttar Pradesh",
  Faizabad: "Uttar Pradesh",
  Fatehpur: "Uttar Pradesh",
  Fazilka: "Punjab",
  Guwahati: "Assam",
  Gwalior: "Madhya Pradesh",
  Gandhinagar: "Gujarat",
  Ghaziabad: "Uttar Pradesh",
  Guntur: "Andhra Pradesh",
  Hyderabad: "Telangana",
  Hubli: "Karnataka",
  Hisar: "Haryana",
  Hazaribagh: "Jharkhand",
  Haldwani: "Uttarakhand",
  Indore: "Madhya Pradesh",
  Itanagar: "Arunachal Pradesh",
  Imphal: "Manipur",
  Ichalkaranji: "Maharashtra",
  Idukki: "Kerala",
  Jaipur: "Rajasthan",
  Jodhpur: "Rajasthan",
  Jamshedpur: "Jharkhand",
  Jhansi: "Uttar Pradesh",
  Jalandhar: "Punjab",
  Kanpur: "Uttar Pradesh",
  Kolkata: "West Bengal",
  Kochi: "Kerala",
  Kota: "Rajasthan",
  Kurnool: "Andhra Pradesh",
  Lucknow: "Uttar Pradesh",
  Ludhiana: "Punjab",
  Latur: "Maharashtra",
  Leh: "Ladakh",
  Lakshadweep: "Lakshadweep",
  Mumbai: "Maharashtra",
  Madurai: "Tamil Nadu",
  Mysuru: "Karnataka",
  Meerut: "Uttar Pradesh",
  Moradabad: "Uttar Pradesh",
  Nagpur: "Maharashtra",
  Nashik: "Maharashtra",
  Noida: "Uttar Pradesh",
  Nellore: "Andhra Pradesh",
  Nizamabad: "Telangana",
  Ongole: "Andhra Pradesh",
  Orai: "Uttar Pradesh",
  Osmanabad: "Maharashtra",
  Ottapalam: "Kerala",
  Ooty: "Tamil Nadu",
  Patna: "Bihar",
  Pune: "Maharashtra",
  Panaji: "Goa",
  Porbandar: "Gujarat",
  Palakkad: "Kerala",
  "Quilon (Kollam)": "Kerala",
  Qadian: "Punjab",
  Qasimpur: "Uttar Pradesh",
  Qutubullapur: "Telangana",
  "Quarry Towns": "",
  Ranchi: "Jharkhand",
  Rajkot: "Gujarat",
  Raipur: "Chhattisgarh",
  Rourkela: "Odisha",
  Ratnagiri: "Maharashtra",
  Surat: "Gujarat",
  Shimla: "Himachal Pradesh",
  Siliguri: "West Bengal",
  Srinagar: "Jammu & Kashmir",
  Secunderabad: "Telangana",
  Thiruvananthapuram: "Kerala",
  Tirupati: "Andhra Pradesh",
  Tiruchirappalli: "Tamil Nadu",
  Thrissur: "Kerala",
  Tezpur: "Assam",
  Udaipur: "Rajasthan",
  Ujjain: "Madhya Pradesh",
  Unnao: "Uttar Pradesh",
  Ulhasnagar: "Maharashtra",
  Una: "Himachal Pradesh",
  Varanasi: "Uttar Pradesh",
  Vadodara: "Gujarat",
  Vijayawada: "Andhra Pradesh",
  Visakhapatnam: "Andhra Pradesh",
  Valsad: "Gujarat",
  Warangal: "Telangana",
  Wardha: "Maharashtra",
  Washim: "Maharashtra",
  Wayanad: "Kerala",
  "West Delhi": "Delhi",
  "Xeldem (Goa)": "Goa",
  "Xavier Nagar": "",
  Xalapur: "",
  // Newly added cities (user requested)
  Anand: "Gujarat",
  Ambala: "Haryana",
  Amreli: "Gujarat",
  Anantapur: "Andhra Pradesh",
  Arrah: "Bihar",
  Ballari: "Karnataka",
  Bardhaman: "West Bengal",
  Bhavnagar: "Gujarat",
  Bharuch: "Gujarat",
  Baramati: "Maharashtra",
  Chikmagalur: "Karnataka",
  Chhatarpur: "Madhya Pradesh",
  Churu: "Rajasthan",
  Chandrapur: "Maharashtra",
  Chiplun: "Maharashtra",
  Diu: "Daman and Diu",
  Dhar: "Madhya Pradesh",
  Dausa: "Rajasthan",
  Dholpur: "Rajasthan",
  Daman: "Daman and Diu",
  Ellenabad: "Haryana",
  Ettumanoor: "Kerala",
  Eklahare: "Maharashtra",
  Eloor: "Kerala",
  Edayarpalayam: "Tamil Nadu",
  "Fatehgarh Sahib": "Punjab",
  Fatehabad: "Haryana",
  Fatehnagar: "Rajasthan",
  "Fatehpur Sikri": "Uttar Pradesh",
  Farrukhabad: "Uttar Pradesh",
  "Gir Somnath": "Gujarat",
  Gadag: "Karnataka",
  Gaya: "Bihar",
  Gondia: "Maharashtra",
  Gulbarga: "Karnataka",
  Hamirpur: "Himachal Pradesh",
  Hoshangabad: "Madhya Pradesh",
  Hingoli: "Maharashtra",
  Himmatnagar: "Gujarat",
  Hansi: "Haryana",
  Ichhapur: "West Bengal",
  Idar: "Gujarat",
  Islampur: "West Bengal",
  Irinjalakuda: "Kerala",
  Itarsi: "Madhya Pradesh",
  Junagadh: "Gujarat",
  Jamnagar: "Gujarat",
  Jalgaon: "Maharashtra",
  Jagdalpur: "Chhattisgarh",
  Jhunjhunu: "Rajasthan",
  Kheda: "Gujarat",
  Kalyan: "Maharashtra",
  Kanchipuram: "Tamil Nadu",
  Karaikudi: "Tamil Nadu",
  Kargil: "Ladakh",
  Lonavala: "Maharashtra",
  Lakhimpur: "Uttar Pradesh",
  Lalitpur: "Uttar Pradesh",
  Lohardaga: "Jharkhand",
  Lunglei: "Mizoram",
  Morbi: "Gujarat",
  Mandya: "Karnataka",
  Munger: "Bihar",
  Mahesana: "Gujarat",
  Mandi: "Himachal Pradesh",
  Navsari: "Gujarat",
  Nanded: "Maharashtra",
  Nalgonda: "Telangana",
  Neemuch: "Madhya Pradesh",
  Nainital: "Uttarakhand",
  Orchha: "Madhya Pradesh",
  Osian: "Rajasthan",
  Okha: "Gujarat",
  Ozar: "Maharashtra",
  Ongpura: "",
  Pali: "Rajasthan",
  Parbhani: "Maharashtra",
  Pithoragarh: "Uttarakhand",
  Puducherry: "Puducherry",
  Palwal: "Haryana",
  "Qila Raipur": "Punjab",
  Quilandy: "Kerala",
  Qasba: "",
  Rewa: "Madhya Pradesh",
  Rohtak: "Haryana",
  "Rae Bareli": "Uttar Pradesh",
  Ramanathapuram: "Tamil Nadu",
  Rishikesh: "Uttarakhand",
  Sangli: "Maharashtra",
  Satara: "Maharashtra",
  Sambalpur: "Odisha",
  Sikar: "Rajasthan",
  Sonipat: "Haryana",
  Tumakuru: "Karnataka",
  Tonk: "Rajasthan",
  Tinsukia: "Assam",
  Thriprayar: "Kerala",
  Tadepalligudem: "Andhra Pradesh",
  Udgir: "Maharashtra",
  Unao: "Uttar Pradesh",
  Uklana: "Haryana",
  Uran: "Maharashtra",
  Upleta: "Gujarat",
  Virar: "Maharashtra",
  Vapi: "Gujarat",
  
  Viluppuram: "Tamil Nadu",
  Vikarabad: "Telangana",
  Wani: "Maharashtra",
  Wankaner: "Gujarat",
  Wanaparthy: "Telangana",
  Wokha: "Nagaland",
};

// Location detection removed — selection is manual via search/dropdown

function CitySelectionModal({ onClose, onSelect }) {
  const [search, setSearch] = useState("");
  const [showPopular, setShowPopular] = useState(false);

  const normalizedQuery = search.trim().toLowerCase();
  const [searchResults, setSearchResults] = useState([]);
  const [popularList, setPopularList] = useState([]);

  useEffect(() => {
    // load popular cities on mount
    let mounted = true;
    getPopularCitiesApi()
      .then((res) => {
        if (mounted && Array.isArray(res)) setPopularList(res);
      })
      .catch(() => {
        // fallback to local popular list
        if (mounted) setPopularList(popularCities.map((c) => ({ name: c, state: cityStateMap[c] || "" })));
      });
    return () => (mounted = false);
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchResults = async () => {
      if (!normalizedQuery) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await getCitiesApi(normalizedQuery);
        if (!mounted) return;
        if (Array.isArray(res) && res.length > 0) {
          setSearchResults(res.map((c) => ({ name: c.name, state: c.state || "" })));
          return;
        }
        // fallback to local search
        const local = normalizedQuery.length === 1
          ? allCities.filter((city) => city[0].toLowerCase() === normalizedQuery)
          : allCities.filter((city) => city.toLowerCase().startsWith(normalizedQuery));
        setSearchResults(local.map((c) => ({ name: c, state: cityStateMap[c] || "" })));
      } catch {
        const local = normalizedQuery.length === 1
          ? allCities.filter((city) => city[0].toLowerCase() === normalizedQuery)
          : allCities.filter((city) => city.toLowerCase().startsWith(normalizedQuery));
        if (mounted) setSearchResults(local.map((c) => ({ name: c, state: cityStateMap[c] || "" })));
      }
    };
    fetchResults();
    return () => (mounted = false);
  }, [normalizedQuery]);

  const handleCitySelect = (city) => {
    onSelect(city);
    setSearch("");
  };

  // detect location removed — users should pick cities from the dropdown

  return (
    <div className="city-modal-overlay" role="presentation" onClick={onClose}>
      <div className="city-modal-card" role="dialog" aria-modal="true" aria-label="Select your city" onClick={(event) => event.stopPropagation()}>
        <div className="city-modal-header">
          <div>
            <h3>Select your city</h3>
            <p className="city-modal-subtitle">Pick a location to personalize your experience.</p>
          </div>
          <button type="button" className="city-modal-close" onClick={onClose} aria-label="Close city selector">
            ×
          </button>
        </div>

        <div className="city-search-row">
          <label className="city-search-input">
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowPopular(false); }}
              placeholder="Search for your city"
              aria-label="Search for your city"
              autoComplete="off"
            />
            
          </label>
        </div>

        <div className="city-search-results">
          {(!normalizedQuery || showPopular) ? (
            <div className="city-popular-grid">
              {(popularList.length > 0 ? popularList : popularCities.map((c) => ({ name: c, state: cityStateMap[c] || "" }))).map((item) => (
                <button key={item.name} type="button" className="city-search-result-row" onClick={() => { handleCitySelect(item.name); setShowPopular(false); }}>
                  <span className="city-pin">📍</span>
                  <div className="city-meta">
                    <span className="city-name">{item.name}</span>
                    <span className="city-state">{item.state || ""}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            (searchResults.length > 0 ? (
              searchResults.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  className="city-search-result-row"
                  onClick={() => handleCitySelect(item.name)}
                >
                  <span className="city-pin">📍</span>
                  <div className="city-meta">
                    <span className="city-name">{item.name}</span>
                    {item.state && <span className="city-state">{item.state}</span>}
                  </div>
                </button>
              ))
            ) : (
              <p className="city-no-results">No matches found. Try another name.</p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default CitySelectionModal;
