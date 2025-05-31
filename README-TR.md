# StellarChoice

Stellar blok zinciri üzerine kurulu, kullanıcıların güvenli ve şeffaf anketler ve seçimler oluşturmasına ve katılmasına olanak tanıyan merkeziyetsiz bir oylama uygulaması.

## Özellikler

- 🚀 Stellar cüzdanlarıyla entegrasyon (Freighter)
- 🗳️ Anket oluşturma ve katılma
- 🔒 Blokzincir tabanlı güvenli ve şeffaf oylama
- 📱 Duyarlı web arayüzü
- ⚡ Next.js ile hızlı ve verimli

## Başlarken

### Ön Gereksinimler

- Node.js (v18 veya üzeri)
- npm veya yarn
- Freighter cüzdanı (Stellar cüzdan eklentisi)

### Kurulum

1. Depoyu klonlayın:
   ```bash
   git clone https://github.com/yusatrn/StellarChoice.git
   cd StellarChoice
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   cd frontend
   npm install
   ```

3. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

4. Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

## Akıllı Sözleşme

Oylama akıllı sözleşmesi Rust ile yazılmıştır ve `contracts/voting_contract.rs` dosyasında bulunmaktadır.

## Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen bir Çekme İsteği (Pull Request) göndermekten çekinmeyin.

## Lisans

Bu proje MIT Lisansı altında lisanslanmıştır - ayrıntılar için [LİSANS](LICENSE) dosyasına bakın.
