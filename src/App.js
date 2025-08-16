import React, { useEffect, useRef, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from "recharts";
import { 
  Building, Thermometer, Zap, FileText, Award, Mail, Shield,
  Phone, UserRoundCheck, AlertTriangle, DollarSign, Snowflake,
  Languages, Download
} from "lucide-react";

/* -------------------------- Yardımcı: Telefon Regex -------------------------- */
const phoneRegex = /^\+?\d{10,15}$/;

/* -------------------------- Dil Verileri -------------------------- */
const translations = {
  tr: {
    title: "TermoLoop CheckBeta",
    subtitle: "Isitma-Sogutma Sistemleri Analiz Platformu",
    welcome: "Merhaba! 👋",
    welcomeText: "Bu formu doldurarak enerji verimliligi yolculugunuzda ilk adimi atmis olacaksiniz.",
    noWorries: "Bilmediginiz detaylar var mi? Hic onemli degil! Elimizdeki bilgilerle baslayalim, eksik kalan kisimlari birlikte tamamlariz.",
    purpose: "Amacimiz sadece mevcut durumunuzu anlamak ve size en uygun cozumleri sunabilmek.",
    duration: "Tahmini sure: 5-7 dakika⏱️",
    ready: "Hazirsaniz baslayalim! 🚀",
    userInfo: "Kullanici Bilgileri",
    projectInfo: "Proje Bilgileri",
    facilityProfile: "Isletme Profili",
    climateData: "Proje Lokasyonu / Iklim Verileri (ASHRAE 2021)",
    monthlyNeeds: "Aylik Isitma ve Sogutma Ihtiyaci (kW)",
    chillers: "Sogutma Gruplari (Chiller)",
    heatingSystem: "Isitma Sistemi",
    costInfo: "Maliyet Bilgileri",
    waterConsumption: "Sogutma Sistemi Tarafindan Tuketilen Su Miktari",
    privacyNotice: "Bu formu doldurarak kisisel verilerinizin islenmesi ve analiz edilmesi konusunda KVKK kapsaminda bilgilendirilmis olur ve onay vermis sayilirsiniz.",
    acceptPrivacy: "Veri gizliligi ve kullanim sartlarini kabul ediyorum",
    createPdf: "PDF Olustur & Gonder",
    createExcel: "Excel Olustur & Indir"
  },
  en: {
    title: "TermoLoop CheckBeta",
    subtitle: "Heating-Cooling Systems Analysis Platform",
    welcome: "Hello! 👋",
    welcomeText: "By filling out this form, you will take the first step in your energy efficiency journey.",
    noWorries: "Are there details you don't know? No worries! Let's start with the information we have and complete the missing parts together.",
    purpose: "Our goal is simply to understand your current situation and offer you the most suitable solutions.",
    duration: "Estimated time: 5-7 minutes⏱️",
    ready: "Ready to start! 🚀",
    userInfo: "User Information",
    projectInfo: "Project Information",
    facilityProfile: "Facility Profile",
    climateData: "Project Location / Climate Data (ASHRAE 2021)",
    monthlyNeeds: "Monthly Heating and Cooling Requirements (kW)",
    chillers: "Cooling Groups (Chiller)",
    heatingSystem: "Heating System",
    costInfo: "Cost Information",
    waterConsumption: "Water Consumption by Cooling System",
    privacyNotice: "By filling out this form, you are informed and consent to the processing and analysis of your personal data under GDPR.",
    acceptPrivacy: "I accept the privacy policy and terms of use",
    createPdf: "Create PDF & Send",
    createExcel: "Create Excel & Download"
  }
};

/* ------------------------------ Bileşen ------------------------------ */
const TermoLoopCheck = () => {
  /* -------------------------- Dil Seçimi -------------------------- */
  const [language, setLanguage] = useState("tr");
  const t = translations[language];

  /* -------------------------- Proje & Kullanıcı -------------------------- */
  const [projectData, setProjectData] = useState({
    name: "",
    email: "",
    role: "",
    phone: "",
    projectName: "",
    city: "",
    otherCity: "",
  });

  /* ------------------------------ İklim Verisi ------------------------------ */
  const [temperatureData, setTemperatureData] = useState({});
  const climateData = {
    izmir: { name: "Izmir", temperatures: [9,10,13,17,22,27,30,30,26,21,15,11], designTemp: { winter: 1, summer: 36 } },
    ankara:{ name:"Ankara",temperatures:[1,3,7,12,17,21,24,24,20,14,8,3], designTemp:{winter:-10, summer:33}},
    istanbul:{name:"Istanbul",temperatures:[6,7,9,14,19,24,26,27,23,18,13,8], designTemp:{winter:-2, summer:32}},
  };
  const months = ["Ocak","Subat","Mart","Nisan","Mayis","Haziran","Temmuz","Agustos","Eylul","Ekim","Kasim","Aralik"];

  /* -------------------------- Aylık Yükler (kW) -------------------------- */
  const [monthlyNeeds, setMonthlyNeeds] = useState({
    heating: Array(12).fill(""),
    cooling: Array(12).fill(""),
  });
  const handleMonthlyNeedChange = (type, month, value) => {
    setMonthlyNeeds((prev) => ({ ...prev, [type]: prev[type].map((v,i)=> i===month? value : v) }));
  };

  /* -------------------------------- Chiller List -------------------------------- */
  const [chillers, setChillers] = useState([
    { id:1, count:1, capacity:"", eer:"", compressorType:"Scroll", brand:"", installationYear:"", chillerType:"", refrigerantType:"" },
  ]);
  const compressorTypes = ["Scroll","Screw","Centrifugal","Reciprocating"];
  const chillerBrands = ["Carrier","Trane","York","Daikin","Mitsubishi Heavy Industries","Johnson Controls","Lennox","McQuay","Climaveneta","Aermec","Frigopol","Airwell","Rhoss","Clivet","Systemair"];
  const chillerTypes = ["Hava Sogutmali", "Su Sogutmali"];
  const refrigerantTypes = ["R22", "R134a", "R407c", "R410a", "R32", "R513a"];
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({length:25},(_,i)=> currentYear - i);

  const addChiller = () => {
    const newId = Math.max(...chillers.map(c=>c.id)) + 1;
    setChillers(prev => [...prev, { id:newId, count:1, capacity:"", eer:"", compressorType:"Scroll", brand:"", installationYear:"", chillerType:"", refrigerantType:"" }]);
  };
  const updateChiller = (id, field, value) => {
    setChillers(prev => prev.map(c=>{
      if(c.id!==id) return c;
      return { ...c, [field]: value };
    }));
  };
  const removeChiller = (id) => { if(chillers.length>1) setChillers(prev => prev.filter(c=>c.id!==id)); };

  const totalChillerCapacity = chillers.reduce((s,c)=> s + (parseFloat(c.capacity)||0) * (parseInt(c.count)||1), 0);

  /* -------------------------------- İşletme Profili -------------------------------- */
  const facilityTypes = [
    { value:"hotel",label:"Otel (7/24 Acik)" },
    { value:"hospital",label:"Hastane (7/24 Acik)" },
    { value:"airport",label:"Havalimani (7/24 Acik)" },
    { value:"mall",label:"Alisveris Merkezi (Gunluk Acilis/Kapanis)" },
    { value:"office",label:"Ofis Binasi (Hafta Ici)" },
    { value:"school",label:"Okul/Universite (Donemsel)" },
    { value:"factory",label:"Fabrika/Uretim Tesisi" },
    { value:"other",label:"Diger" },
  ];
  const [facilityType, setFacilityType] = useState({
    type: "",
    operatingProfile: { hoursPerDay:"", daysPerWeek:"", annualHours:0 },
  });
  const updateOperatingProfile = (field, value) => {
    setFacilityType(prev=>{
      const u = { ...prev, operatingProfile: { ...prev.operatingProfile, [field]: value } };
      const h = parseFloat(u.operatingProfile.hoursPerDay)||0;
      const d = parseFloat(u.operatingProfile.daysPerWeek)||0;
      u.operatingProfile.annualHours = Math.round(h*d*52);
      return u;
    });
  };

  /* --------------------------------- Isıtma --------------------------------- */
  const fuelTypes = { dogalgaz:"Dogal Gaz", fuelOil:"Fuel Oil", lng:"LNG", lpg:"LPG" };
  const [heatingSystem, setHeatingSystem] = useState({
    fuelType:"dogalgaz", waterTemp:"65", producedTemp:"55", boilerCount:1, boilerCapacity:"",
  });

  /* --------------------------------- Maliyet & Su --------------------------------- */
  const [costs, setCosts] = useState({ electricity:"2.45", fuel:"4.80", water:"3.50" });
  const [waterConsumption, setWaterConsumption] = useState({ annualConsumption:"" });

  /* --------------------------------- KVKK --------------------------------- */
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  /* ------------------------------ UI / Mail Durumu ------------------------------ */
  const [emailStatus, setEmailStatus] = useState("");

  /* ------------------------------ Handlers ------------------------------ */
  const handleProjectDataChange = (field, value) => {
    setProjectData(prev => ({ ...prev, [field]: value }));
    if(field==="city"){
      if(climateData[value]) setTemperatureData(climateData[value]);
      else setTemperatureData({});
    }
  };

  /* -------------------------------- Grafik -------------------------------- */
  const getChartData = () =>
    months.map((m,i)=>({
      month: m.substring(0,3),
      heating: parseFloat(monthlyNeeds.heating[i])||0,
      cooling: parseFloat(monthlyNeeds.cooling[i])||0,
      temperature: temperatureData.temperatures ? temperatureData.temperatures[i] : 0,
    }));

  /* ---------------------- PDF üretim alanı için ref ---------------------- */
  const pdfRef = useRef(null);

  /* -------------------- Excel Export -------------------- */
  const exportToExcel = () => {
    const data = {
      "Kullanici Bilgileri": {
        "Ad Soyad": projectData.name,
        "Gorev": projectData.role,
        "Email": projectData.email,
        "Telefon": projectData.phone,
        "Proje Adi": projectData.projectName,
        "Sehir": projectData.city === "other" ? projectData.otherCity : climateData[projectData.city]?.name || projectData.city
      },
      "Isletme Profili": {
        "Isletme Turu": facilityType.type,
        "Gunluk Saat": facilityType.operatingProfile.hoursPerDay,
        "Haftalik Gun": facilityType.operatingProfile.daysPerWeek,
        "Yillik Saat": facilityType.operatingProfile.annualHours
      },
      "Chillerlar": chillers.map((c, i) => ({
        "Chiller": i + 1,
        "Adet": c.count,
        "Marka": c.brand,
        "Tip": c.chillerType,
        "Kompressor": c.compressorType,
        "Gaz": c.refrigerantType,
        "Kapasite": c.capacity,
        "EER": c.eer,
        "Yil": c.installationYear
      })),
      "Maliyetler": {
        "Elektrik": costs.electricity + " EUR/kWh",
        "Yakit": costs.fuel + " EUR/m3",
        "Su": costs.water + " EUR/m3",
        "Yillik Su Tuketimi": waterConsumption.annualConsumption + " m3"
      }
    };

    // Simple CSV export
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "TermoLoop Check - Analiz Raporu\n\n";
    
    Object.keys(data).forEach(section => {
      csvContent += section + "\n";
      if (Array.isArray(data[section])) {
        data[section].forEach(item => {
          csvContent += Object.values(item).join(",") + "\n";
        });
      } else {
        Object.entries(data[section]).forEach(([key, value]) => {
          csvContent += key + "," + value + "\n";
        });
      }
      csvContent += "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "termoloop_analiz.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* -------------------- PDF + Mail (Mock Function) -------------------- */
  const createPdfAndSend = async () => {
    // Doğrulamalar
    if(!privacyAccepted){ alert("Lutfen veri gizliligi ve kullanim sartlarini kabul ediniz."); return; }
    const { name, email, phone, role, projectName } = projectData;
    if(!name || !email || !phone || !role || !projectName){
      alert("Lutfen zorunlu alanlari doldurunuz (Ad Soyad, E-mail, Cep Telefonu, Gorev, Proje Adi).");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)){ alert("Gecerli bir e-posta giriniz."); return; }
    if(!phoneRegex.test(phone)){ alert("Gecerli bir cep telefonu giriniz. Orn: +905xxxyyyzzz"); return; }
    if(projectData.city==="other" && !projectData.otherCity.trim()){
      alert("Diger sehir secildi; lutfen sehir adini yaziniz."); return;
    }

    // Mock PDF creation
    setEmailStatus("PDF olusturuluyor...");
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try{
      setEmailStatus("Mail gonderiliyor...");
      
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEmailStatus("PDF eklendi ve e-posta gonderildi!");
      alert("Basarili: PDF eklendi ve e-posta gonderildi.\nLutfen gelen kutularinizi kontrol edin.");
    }catch(e){
      console.error(e);
      setEmailStatus("Hata: Mail gonderilemedi.");
      alert("Mail gonderimi sirasinda hata olustu. Konsolu kontrol edin.");
    }
  };

  /* -------------------------------- UI -------------------------------- */
  return (
    <div className="max-w-6xl mx-auto p-6 bg-white" ref={pdfRef}>
      {/* Dil Seçimi */}
      <div className="flex justify-end mb-4">
        <div className="flex items-center space-x-2">
          <Languages className="w-4 h-4 text-gray-500" />
          <button 
            onClick={() => setLanguage("tr")}
            className={`px-3 py-1 rounded ${language === "tr" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            TR
          </button>
          <button 
            onClick={() => setLanguage("en")}
            className={`px-3 py-1 rounded ${language === "en" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            EN
          </button>
        </div>
      </div>

      {/* Yeni Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <Building className="w-8 h-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-800">
            TermoLoop Check<span className="text-lg font-normal text-gray-500">Beta</span>
          </h1>
        </div>
        <p className="text-gray-600 text-lg mb-4">{t.subtitle}</p>
        
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border-l-4 border-blue-400">
          <h2 className="text-xl font-bold text-blue-800 mb-3">{t.welcome}</h2>
          <p className="text-gray-700 mb-2">{t.welcomeText}</p>
          <p className="text-gray-700 mb-2">{t.noWorries}</p>
          <p className="text-gray-700 mb-3">{t.purpose}</p>
          <div className="flex items-center justify-center space-x-4 text-sm">
            <span className="bg-yellow-100 px-3 py-1 rounded-full text-yellow-800 font-medium">{t.duration}</span>
            <span className="text-green-600 font-bold">{t.ready}</span>
          </div>
        </div>
      </div>

      {/* Email Status */}
      {emailStatus && (
        <div className={`mb-6 p-4 rounded-lg border ${
          emailStatus.includes("eklendi") ? "bg-green-50 border-green-200 text-green-800"
          : emailStatus.includes("Hata") ? "bg-red-50 border-red-200 text-red-800"
          : "bg-blue-50 border-blue-200 text-blue-800"}`}>
          <div className="flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            <p className="font-medium">{emailStatus}</p>
          </div>
        </div>
      )}

      {/* Kullanıcı Bilgileri */}
      <div className="bg-white p-6 rounded-lg mb-8 border">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <UserRoundCheck className="w-5 h-5 mr-2" /> {t.userInfo}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input type="text" placeholder="Ad Soyad *" className="p-3 border rounded-lg"
            value={projectData.name} onChange={(e)=>handleProjectDataChange("name", e.target.value)} />
          <input type="text" placeholder="Gorev / Unvan *" className="p-3 border rounded-lg"
            value={projectData.role} onChange={(e)=>handleProjectDataChange("role", e.target.value)} />
          <input type="email" placeholder="E-mail *" className="p-3 border rounded-lg"
            value={projectData.email} onChange={(e)=>handleProjectDataChange("email", e.target.value)} />
          <div className="relative">
            <input type="tel" placeholder="Cep Telefonu (+90...) *" className="p-3 border rounded-lg pr-10"
              value={projectData.phone} onChange={(e)=>handleProjectDataChange("phone", e.target.value)} />
            <Phone className="w-4 h-4 absolute right-3 top-3.5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Proje Bilgileri */}
      <div className="bg-gray-50 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          {t.projectInfo}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" placeholder="Proje Adi *" className="p-3 border rounded-lg"
            value={projectData.projectName} onChange={(e)=>handleProjectDataChange("projectName", e.target.value)} />
          <input type="text" placeholder="Notlar (opsiyonel)" className="p-3 border rounded-lg" />
        </div>
      </div>

      {/* İşletme Profili */}
      <div className="bg-purple-50 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">{t.facilityProfile}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Isletme Turu</label>
            <select className="w-full p-3 border rounded-lg" value={facilityType.type}
              onChange={(e)=>setFacilityType(prev=>({ ...prev, type:e.target.value }))}>
              <option value="">Isletme turunu seciniz</option>
              {facilityTypes.map(t=> <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Gunluk Calisma Saati</label>
            <select className="w-full p-3 border rounded-lg" value={facilityType.operatingProfile.hoursPerDay}
              onChange={(e)=>updateOperatingProfile("hoursPerDay", e.target.value)}>
              <option value="">Saat seciniz</option>
              <option value="8">8 Saat</option><option value="10">10 Saat</option>
              <option value="12">12 Saat</option><option value="16">16 Saat</option>
              <option value="18">18 Saat</option><option value="24">24 Saat</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Haftalik Calisma Gunu</label>
            <select className="w-full p-3 border rounded-lg" value={facilityType.operatingProfile.daysPerWeek}
              onChange={(e)=>updateOperatingProfile("daysPerWeek", e.target.value)}>
              <option value="">Gun seciniz</option>
              <option value="5">5 Gun</option><option value="6">6 Gun</option><option value="7">7 Gun</option>
            </select>
          </div>
        </div>
        {facilityType.operatingProfile.annualHours>0 && (
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-sm font-medium text-blue-800">
              Yillik Calisma Saatiniz: <strong>{facilityType.operatingProfile.annualHours.toLocaleString()} saat</strong>
            </p>
          </div>
        )}
      </div>

      {/* İklim / Lokasyon */}
      <div className="bg-blue-50 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Thermometer className="w-5 h-5 mr-2" />
          {t.climateData}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {Object.entries(climateData).map(([key, data])=>(
            <button key={key} onClick={()=>handleProjectDataChange("city", key)}
              className={`p-4 rounded-lg border-2 transition-all ${projectData.city===key? "border-blue-500 bg-blue-100":"border-gray-300 hover:border-blue-300"}`}>
              <h3 className="font-semibold">{data.name}</h3>
              <p className="text-sm text-gray-600">Kis: {data.designTemp.winter}C | Yaz: {data.designTemp.summer}C</p>
            </button>
          ))}
          <button onClick={()=>handleProjectDataChange("city","other")}
            className={`p-4 rounded-lg border-2 transition-all ${projectData.city==="other"?"border-blue-500 bg-blue-100":"border-gray-300 hover:border-blue-300"}`}>
            <h3 className="font-semibold">Diger</h3>
            <p className="text-sm text-gray-600">Sehir adini kendiniz girin</p>
          </button>
        </div>

        {projectData.city==="other" && (
          <div className="bg-white p-4 rounded-lg mb-4 border">
            <label className="block text-sm font-medium mb-2">Sehir (yaziniz)</label>
            <input type="text" className="w-full p-3 border rounded-lg" value={projectData.otherCity}
              onChange={(e)=>handleProjectDataChange("otherCity", e.target.value)} placeholder="Orn: Bursa" />
            <p className="text-xs text-gray-500 mt-2">Not: Diger sehir secildiginde sicaklik grafigi gizlenir.</p>
          </div>
        )}

        {temperatureData.temperatures && (
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Aylik Ortalama Sicakliklar</h4>
            <div className="grid grid-cols-6 md:grid-cols-12 gap-2 text-sm">
              {temperatureData.temperatures.map((t,i)=>(
                <div key={i} className="text-center">
                  <div className="font-medium">{months[i].substring(0,3)}</div>
                  <div className="text-blue-600">{t}C</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Yük Girişleri */}
      <div className="bg-gradient-to-r from-orange-50 to-cyan-50 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">{t.monthlyNeeds}</h2>
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg">
            <h3 className="font-semibold text-red-700 mb-2">Isitma Ihtiyaci (kW)</h3>
            <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
              {months.map((m,i)=>(
                <div key={i}>
                  <label className="text-sm font-medium text-red-600">{m.substring(0,3)}</label>
                  <input type="number" min="0" step="0.1" className="w-full p-2 border border-red-200 rounded focus:border-red-400"
                    value={monthlyNeeds.heating[i]} onChange={(e)=>handleMonthlyNeedChange("heating", i, e.target.value)} placeholder="0" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-700 mb-2">Sogutma Ihtiyaci (kW)</h3>
            <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
              {months.map((m,i)=>(
                <div key={i}>
                  <label className="text-sm font-medium text-blue-600">{m.substring(0,3)}</label>
                  <input type="number" min="0" step="0.1" className="w-full p-2 border border-blue-200 rounded focus:border-blue-400"
                    value={monthlyNeeds.cooling[i]} onChange={(e)=>handleMonthlyNeedChange("cooling", i, e.target.value)} placeholder="0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grafik */}
      {(monthlyNeeds.heating.some(v=>v) || monthlyNeeds.cooling.some(v=>v)) && (
        <div className="bg-white p-6 rounded-lg border mb-8 shadow-md">
          <h2 className="text-xl font-semibold mb-4">Aylik Yuk Analizi</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={getChartData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" /><YAxis /><Tooltip /><Legend />
              <Line type="monotone" dataKey="heating" stroke="#dc2626" strokeWidth={3} name="Isitma (kW)" />
              <Line type="monotone" dataKey="cooling" stroke="#2563eb" strokeWidth={3} name="Sogutma (kW)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Chillerler */}
      <div className="bg-blue-50 p-6 rounded-lg mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Snowflake className="w-5 h-5 mr-2" /> {t.chillers}
          </h2>
          <button onClick={addChiller} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Chiller Ekle</button>
        </div>

        {chillers.map((ch, idx)=>(
          <div key={ch.id} className="bg-white p-4 rounded-lg mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Chiller #{idx+1}</h3>
              {chillers.length>1 && <button onClick={()=>removeChiller(ch.id)} className="text-red-600 hover:text-red-800 text-sm">Kaldir</button>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Chiller Tipi</label>
                <select className="w-full p-2 border rounded" value={ch.chillerType} 
                  onChange={(e)=>updateChiller(ch.id,"chillerType", e.target.value)}>
                  <option value="">Seciniz</option>
                  {chillerTypes.map(t=> <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Adet</label>
                <input type="number" className="w-full p-2 border rounded" value={ch.count} min="1" step="1"
                  onChange={(e)=>updateChiller(ch.id,"count", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Marka</label>
                <select className="w-full p-2 border rounded" value={ch.brand} 
                  onChange={(e)=>updateChiller(ch.id,"brand", e.target.value)}>
                  <option value="">Seciniz</option>
                  {chillerBrands.map(b=> <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kurulum Yili</label>
                <select className="w-full p-2 border rounded" value={ch.installationYear}
                  onChange={(e)=>updateChiller(ch.id,"installationYear", e.target.value)}>
                  <option value="">Yil</option>
                  {yearOptions.map(y=> <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kapasite (kW)</label>
                <input type="number" min="0" step="0.1" className="w-full p-2 border rounded" value={ch.capacity}
                  onChange={(e)=>updateChiller(ch.id,"capacity", e.target.value)} placeholder="500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">EER</label>
                <input type="number" min="0" step="0.1" className="w-full p-2 border rounded" value={ch.eer}
                  onChange={(e)=>updateChiller(ch.id,"eer", e.target.value)} placeholder="3.2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kompressor Tipi</label>
                <select className="w-full p-2 border rounded" value={ch.compressorType}
                  onChange={(e)=>updateChiller(ch.id,"compressorType", e.target.value)}>
                  {compressorTypes.map(t=> <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sogutucu Gaz</label>
                <select className="w-full p-2 border rounded" value={ch.refrigerantType}
                  onChange={(e)=>updateChiller(ch.id,"refrigerantType", e.target.value)}>
                  <option value="">Seciniz</option>
                  {refrigerantTypes.map(r=> <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}

        <div className="bg-gray-100 p-4 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalChillerCapacity.toFixed(0)} kW</div>
            <div className="text-sm text-gray-600">Toplam Kurulu Guc</div>
          </div>
        </div>
      </div>

      {/* Isıtma */}
      <div className="bg-red-50 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Thermometer className="w-5 h-5 mr-2" /> {t.heatingSystem}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Yakit Tipi</label>
            <select className="w-full p-2 border rounded" value={heatingSystem.fuelType}
              onChange={(e)=>setHeatingSystem(prev=>({ ...prev, fuelType:e.target.value }))}>
              {Object.entries(fuelTypes).map(([k,v])=> <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Kazan Adedi</label>
            <input type="number" className="w-full p-2 border rounded" value={heatingSystem.boilerCount} min="1" step="1"
              onChange={(e)=>setHeatingSystem(prev=>({ ...prev, boilerCount:e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Kazan Kapasitesi (kW)</label>
            <input type="number" className="w-full p-2 border rounded" value={heatingSystem.boilerCapacity} min="0" step="0.1"
              onChange={(e)=>setHeatingSystem(prev=>({ ...prev, boilerCapacity:e.target.value }))} placeholder="300" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sicak Su Set Gidis (C)</label>
            <input type="number" className="w-full p-2 border rounded" value={heatingSystem.waterTemp}
              onChange={(e)=>setHeatingSystem(prev=>({ ...prev, waterTemp:e.target.value }))} placeholder="65" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Donus Suyu Sicakligi (C)</label>
            <input type="number" className="w-full p-2 border rounded" value={heatingSystem.producedTemp}
              onChange={(e)=>setHeatingSystem(prev=>({ ...prev, producedTemp:e.target.value }))} placeholder="55" />
          </div>
        </div>
      </div>

      {/* Maliyet */}
      <div className="bg-yellow-50 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <DollarSign className="w-5 h-5 mr-2" /> {t.costInfo}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Elektrik Birim Fiyati (EUR/kWh)</label>
            <input type="number" min="0" step="0.01" className="w-full p-2 border rounded"
              value={costs.electricity} onChange={(e)=>setCosts(prev=>({ ...prev, electricity:e.target.value }))} placeholder="2.45" />
            <p className="text-xs text-gray-500 mt-1">Orn: 2.45 EUR/kWh</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Yakit Fiyati (EUR/m3)</label>
            <input type="number" min="0" step="0.01" className="w-full p-2 border rounded"
              value={costs.fuel} onChange={(e)=>setCosts(prev=>({ ...prev, fuel:e.target.value }))} placeholder="4.80" />
            <p className="text-xs text-gray-500 mt-1">Orn: 4.80 EUR/m3</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Su Birim Fiyati (EUR/m3)</label>
            <input type="number" min="0" step="0.01" className="w-full p-2 border rounded"
              value={costs.water} onChange={(e)=>setCosts(prev=>({ ...prev, water:e.target.value }))} placeholder="3.50" />
            <p className="text-xs text-gray-500 mt-1">Orn: 3.50 EUR/m3</p>
          </div>
        </div>
      </div>

      {/* Su Tüketimi */}
      <div className="bg-cyan-50 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2" /> {t.waterConsumption}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Yillik Su Tuketimi (m3/yil)</label>
            <input type="number" min="0" step="1" className="w-full p-2 border rounded"
              value={waterConsumption.annualConsumption} 
              onChange={(e)=>setWaterConsumption(prev=>({ ...prev, annualConsumption:e.target.value }))} 
              placeholder="1200" />
            <p className="text-xs text-gray-500 mt-1">Sogutma sistemi tarafindan tuketilen yillik su miktari</p>
          </div>
        </div>
      </div>

      {/* Pitch */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg mb-8 border border-green-200">
        <div className="flex items-start">
          <Award className="w-8 h-8 text-green-600 mr-4 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">Profesyonel Analiz & Surdurulebilirlik</h3>
            <p className="text-green-700 mb-3">Bu form ile isletmenizin enerji verimliligi ve surdurulebilirlik yolculugunda <strong>ilk adimi</strong> attiniz.</p>
            <div className="space-y-2 text-sm text-green-600">
              <p>✓ <strong>Enerji Tuketimi Optimizasyonu</strong></p>
              <p>✓ <strong>Elektrifikasyon & Isi Pompasi Cozumleri</strong></p>
              <p>✓ <strong>CO2 Azaltimi & Yatirim Analizi</strong></p>
              <p>✓ <strong>Dogru Teknoloji Secimi</strong></p>
            </div>
            <div className="mt-4 p-3 bg-white rounded border-l-4 border-green-400">
              <p className="text-sm text-gray-700">Verileriniz detayli incelenerek size ozel <strong>kapsamli teknik rapor</strong> hazirlanacaktir.</p>
            </div>
          </div>
        </div>
      </div>

      {/* KVKK - PDF butonunun üstüne taşındı */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-blue-600 mr-2" />
          <p className="text-sm text-blue-800">{t.privacyNotice}</p>
        </div>
        <div className="mt-2">
          <label className="flex items-center">
            <input type="checkbox" checked={privacyAccepted} onChange={(e)=>setPrivacyAccepted(e.target.checked)} className="mr-2" />
            <span className="text-sm text-blue-700">{t.acceptPrivacy}</span>
          </label>
        </div>
      </div>

      {/* Gönder */}
      <div className="text-center bg-gray-50 p-8 rounded-lg">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">PDF olusturup e-posta ile gonderelim mi?</h3>
          <p className="text-gray-600 text-sm">PDF eklentisi ile size ve <strong>info@termoloop.com</strong> adresine gonderilecektir.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button onClick={createPdfAndSend} disabled={!privacyAccepted}
            className={`px-8 py-4 rounded-lg text-lg font-semibold flex items-center transition-all ${
              privacyAccepted ? "bg-green-600 text-white hover:bg-green-700 shadow-lg" : "bg-gray-400 text-gray-200 cursor-not-allowed"}`}>
            <Mail className="w-5 h-5 mr-2" /> {t.createPdf}
          </button>

          <button onClick={exportToExcel}
            className="px-8 py-4 rounded-lg text-lg font-semibold flex items-center bg-blue-600 text-white hover:bg-blue-700 shadow-lg transition-all">
            <Download className="w-5 h-5 mr-2" /> {t.createExcel}
          </button>
        </div>

        {!privacyAccepted && <p className="text-red-500 text-sm mt-2">Lutfen veri gizliligi sartlarini kabul ediniz</p>}

        <div className="mt-4 text-xs text-gray-500">
          <p>Alicilar: Siz & info@termoloop.com</p>
          <p>Verileriniz SSL ile korunur</p>
          <p>PDF ekli e-posta gonderimi</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} TermoLoop --- Surdurulebilir Iklim Teknolojileri</p>
        <p className="mt-2">Iletisim: info@termoloop.com | www.termoloop.com</p>
      </div>
    </div>
  );
};

export default TermoLoopCheck;
