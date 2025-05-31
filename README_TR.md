# StellarChoice

Stellar blockchain üzerine inşa edilmiş, topluluklar ve organizasyonlar için güvenli, şeffaf ve değiştirilemez oylama çözümleri sunan merkeziyetsiz bir oylama uygulaması.

![StellarChoice Banner](https://via.placeholder.com/1200x400/1e293b/ffffff?text=StellarChoice+Oylama+Platformu)

## 🌟 Özellikler

- 🔐 **Güvenli Kimlik Doğrulama**
  - Freighter cüzdanı ile bağlantı (Stellar'ın resmi cüzdanı)
  - Uçtan uca şifreli işlemler
  - Kullanıcıların anahtarlarını kontrol ettiği kendi kendine yeten çözüm

- 🗳️ **Oylama Sistemi**
  - Anket oluşturma ve katılım
  - Gerçek zamanlı oy sayımı
  - Şeffaf ve denetlenebilir sonuçlar
  - Doğrulanmış cüzdan adresi başına bir oy

- 🚀 **Kullanıcı Deneyimi**
  - Modern, duyarlı arayüz
  - Gerçek zamanlı güncellemeler
  - İşlem durumu takibi
  - Mobil uyumlu tasarım

- 🔗 **Blockchain Entegrasyonu**
  - Stellar blockchain üzerine inşa edilmiştir
  - Akıllı kontrat destekli
  - Hızlı ve düşük maliyetli işlemler
  - Şeffaf ve değiştirilemez kayıtlar

## 🚀 Başlarken

### Ön Gereksinimler

- [Node.js](https://nodejs.org/) (v18 veya üzeri)
- [npm](https://www.npmjs.com/) veya [Yarn](https://yarnpkg.com/)
- [Freighter Cüzdan](https://www.freighter.app/) (Tarayıcı eklentisi)
- Temel Stellar blockchain bilgisi

### Kurulum

1. **Depoyu klonlayın**
   ```bash
   git clone https://github.com/yusatrn/StellarChoice.git
   cd StellarChoice
   ```

2. **Bağımlılıkları yükleyin**
   ```bash
   cd frontend
   npm install
   # veya
   yarn install
   ```

3. **Ortam değişkenlerini ayarlayın**
   `frontend` dizininde `.env.local` dosyası oluşturun:
   ```env
   NEXT_PUBLIC_STELLAR_NETWORK=TESTNET  # veya ANA AĞ için PUBLIC
   NEXT_PUBLIC_CONTRACT_ID=AKILLI_KONTRAHAT_ID
   ```

4. **Geliştirme sunucusunu başlatın**
   ```bash
   npm run dev
   # veya
   yarn dev
   ```

5. **Tarayıcınızı açın**
   [http://localhost:3000](http://localhost:3000) adresini ziyaret edin

## 📱 Uygulamayı Kullanma

1. **Cüzdanınızı Bağlayın**
   - "Cüzdanı Bağla" butonuna tıklayın
   - Freighter ile yetkilendirin
   - Bağlantıyı onaylayın

2. **Oylama**
   - Mevcut anketleri görüntüleyin
   - Tercih ettiğiniz seçeneği seçin
   - İşlemi onaylayın
   - Gerçek zamanlı sonuçları görüntüleyin

3. **Anket Oluşturma** (Yönetici)
   - "Anket Oluştur" sayfasına gidin
   - Anket detaylarını doldurun
   - Başlangıç/bitiş zamanlarını ayarlayın
   - Anketi yayınlayın

## 🛠️ Proje Yapısı

```
frontend/
├── app/                    # Next.js uygulama dizini
│   ├── components/         # Tekrar kullanılabilir UI bileşenleri
│   ├── contexts/           # React context'leri
│   ├── lib/                # Yardımcı fonksiyonlar
│   └── styles/             # Global stiller
├── public/                 # Statik dosyalar
├── contracts/              # Akıllı kontratlar
└── tests/                  # Test dosyaları
```

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen şu adımları izleyin:

1. Depoyu çatallayın (fork)
2. Bir özellik dalı oluşturun (`git checkout -b ozellik/HarikaOzellik`)
3. Değişikliklerinizi kaydedin (`git commit -m 'Harika bir özellik ekle'`)
4. Dalı uzak sunucuya gönderin (`git push origin ozellik/HarikaOzellik`)
5. Bir Çekme İsteği (Pull Request) açın

## 📜 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır - detaylar için [LİSANS](LICENSE) dosyasına bakınız.

## 📞 Destek

Destek için lütfen GitHub deposunda bir konu açın.

## 🙏 Teşekkürler

- Stellar Development Foundation
- Freighter Cüzdan Ekibi
- Tüm katkıda bulunanlar ve testçiler
