from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from datetime import datetime, timedelta
import ipaddress

def generate_self_signed_cert():
    # สร้างกุญแจส่วนตัว
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    # ตั้งชื่อใบรับรอง
    subject = issuer = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, u"172.20.10.2")])

    # สร้างใบรับรอง
    cert = x509.CertificateBuilder().subject_name(
        subject
    ).issuer_name(
        issuer
    ).public_key(
        key.public_key()
    ).serial_number(
        x509.random_serial_number()
    ).not_valid_before(
        datetime.utcnow()
    ).not_valid_after(
        datetime.utcnow() + timedelta(days=365)
    ).add_extension(
        x509.SubjectAlternativeName([x509.DNSName(u"localhost"), x509.IPAddress(ipaddress.ip_address(u"172.20.10.2"))]),
        critical=False,
    ).sign(key, hashes.SHA256())

    # บันทึกไฟล์
    with open("key.pem", "wb") as f:
        f.write(key.private_bytes(encoding=serialization.Encoding.PEM, format=serialization.PrivateFormat.TraditionalOpenSSL, encryption_algorithm=serialization.NoEncryption()))
    with open("cert.pem", "wb") as f:
        f.write(cert.public_bytes(serialization.Encoding.PEM))

    print("✅ สร้างไฟล์ cert.pem และ key.pem เรียบร้อยแล้ว!")

if __name__ == "__main__":
    generate_self_signed_cert()