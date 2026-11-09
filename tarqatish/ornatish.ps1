# Upakovka - Bazis skriptini o'rnatish
# Bazis sozlamasidagi skriptlar papkasini (PathScript) topadi va "Upakovka" papkasini unga nusxalaydi.
param([switch]$Jim, [string]$Manzil = '')   # -Jim: oynasiz; -Manzil: sinov uchun boshqa papka
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
function Xabar($t, $ico) { if ($Jim) { Write-Output $t; return }; [System.Windows.Forms.MessageBox]::Show($t, 'Upakovka - o''rnatish', 'OK', $ico) | Out-Null }
try {
	$src = Join-Path $PSScriptRoot 'Upakovka'
	if (-not (Test-Path (Join-Path $src 'Upakovka.js'))) { throw "Arxivni avval to'liq oching (Extract), keyin ORNATISH.bat ni ishga tushiring." }
	$dst = $Manzil
	if (-not $dst) {
		$set = Join-Path $env:APPDATA 'Bazis\Settings.xml'
		if (Test-Path $set) {
			$m = [regex]::Match([IO.File]::ReadAllText($set), '<PathScript>([^<]+)</PathScript>')
			if ($m.Success -and (Test-Path $m.Groups[1].Value)) { $dst = $m.Groups[1].Value }
		}
	}
	if (-not $dst) {
		$f = New-Object System.Windows.Forms.FolderBrowserDialog
		$f.Description = "Bazis skriptlar papkasi topilmadi. Bazis'dagi Скрипты papkasini tanlang:"
		if ($f.ShowDialog() -ne 'OK') { throw "Papka tanlanmadi - o'rnatish to'xtatildi." }
		$dst = $f.SelectedPath
	}
	$to = Join-Path $dst 'Upakovka'
	New-Item -ItemType Directory -Force $to | Out-Null
	Copy-Item (Join-Path $src '*') $to -Force
	Xabar ("O'rnatildi:`n$to`n`nBazis'ni qayta oching, keyin:`nСкрипты -> Upakovka -> Upakovka -> UPAKOVKA QILISH.`n`nQo'llanma: shu papkadagi QOLLANMA.txt") 'Information'
} catch {
	Xabar ("Xato: " + $_.Exception.Message) 'Error'
	exit 1
}
