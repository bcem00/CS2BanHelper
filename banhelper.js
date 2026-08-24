const SteamUser = require('steam-user');
const GlobalOffensive = require('globaloffensive');
const readlineSync = require('readline-sync'); // Terminal okuma kütüphanesi eklendi

console.log("--- CS2 BAN SORGULAMA BOTU ---");

// Terminalden kullanıcı adı ve şifreyi alıyoruz
const kullaniciAdi = readlineSync.question("Steam Kullanici Adi: ");

// Şifreyi alırken 'hideEchoBack' ile ekranda görünmesini engelliyoruz
const sifre = readlineSync.question("Steam Sifresi (Yazarken ekranda gorunmez): ", {
    hideEchoBack: true
});

console.log("\nBilgiler alindi. Steam'e baglaniliyor...");

// İstemcileri oluşturuyoruz
const client = new SteamUser();
const csgo = new GlobalOffensive(client);

// Terminalden aldığımız bilgileri giriş seçeneklerine veriyoruz
const logOnOptions = {
    accountName: kullaniciAdi,
    password: sifre
};

client.logOn(logOnOptions);

// 1. ADIM: Steam ağına başarılı giriş
client.on('loggedOn', () => {
    console.log("[+] Steam'e basariyla giris yapildi! CS2 baslatiliyor...");
    
    // Hesabı çevrimiçi duruma getiriyoruz
    client.setPersona(SteamUser.EPersonaState.Online);
    
    // CS2'nin AppID'sini (730) kullanarak oyunu "oynanıyor" olarak gösteriyoruz
    client.gamesPlayed([730]);
});

// 2. ADIM: CS2 Game Coordinator ağına bağlantı
csgo.on('connectedToGC', () => {
    console.log("[+] CS2 Game Coordinator'a (GC) baglanildi! Veriler bekleniyor...");
});

// 3. ADIM: GC'den Matchmaking / Account verisinin gelmesi
csgo.on('accountData', (accountData) => {
    console.log("\n========== HESAP REKABETCI DURUMU ==========");
    
    // Eğer veri yoksa varsayılan olarak 0 atıyoruz
    const penaltySeconds = accountData.penalty_seconds || 0;
    const penaltyReason = accountData.penalty_reason || 0;
    
    if (penaltySeconds > 0) {
        // Saniyeyi saate ve güne çevirerek daha okunaklı yapıyoruz
        const saat = (penaltySeconds / 3600).toFixed(1);
        const gun = (penaltySeconds / 86400).toFixed(1);
        
        console.log(`[!] DIKKAT: Bu hesapta rekabetci bekleme suresi (Cooldown) var!`);
        console.log(`[!] Kalan Sure: ${penaltySeconds} saniye (Yaklasik ${saat} saat / ${gun} gun)`);
        console.log(`[!] Ceza Nedeni (Reason Code): ${penaltyReason}`);
    } else {
        console.log("[+] Hesap temiz. Herhangi bir rekabetci bekleme suresi bulunmuyor.");
    }
    
    console.log("============================================\n");
    
    // İşlem bittikten sonra hesaptan çıkış yapıp programı sonlandırıyoruz
    console.log("Baglanti kesiliyor...");
    client.logOff();
    process.exit(0);
});

// Olası Steam giriş hatalarını yakalama (Yanlış şifre, ban vb.)
client.on('error', (err) => {
    console.error("\n[-] Steam baglanti hatasi olustu: ", err.message || err);
    process.exit(1);
});