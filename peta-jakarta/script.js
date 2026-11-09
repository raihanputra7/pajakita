(function () {
  "use strict";

  var data = window.PETA_JAKARTA;
  if (!data) return;

  var NS = "http://www.w3.org/2000/svg";
  var svg = document.getElementById("peta");
  var tooltip = document.getElementById("tooltip");
  var infoNama = document.getElementById("info-nama");
  var infoJenis = document.getElementById("info-jenis");
  var daftar = document.getElementById("daftar");
  var kartu = svg.parentElement;

  var kunci = null;      // kota yang dikunci lewat klik
  var item = [];         // { data, g, tombol }

  /* ---------- Warna pudar: saturasi dikecilkan, hue tetap ---------- */
  function hexKeHsl(hex) {
    var r = parseInt(hex.slice(1, 3), 16) / 255,
        g = parseInt(hex.slice(3, 5), 16) / 255,
        b = parseInt(hex.slice(5, 7), 16) / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return [h, s, l];
  }
  function pudar(hex) {
    var hsl = hexKeHsl(hex);
    var s = hsl[1] * 0.3;                 // saturasi tinggal 30%
    var l = Math.min(hsl[2] * 0.55 + 0.33, 0.74); // tidak pernah mendekati putih
    return "hsl(" + hsl[0].toFixed(0) + " " + (s * 100).toFixed(0) + "% " + (l * 100).toFixed(0) + "%)";
  }

  /* ---------- Gambar peta ---------- */
  svg.setAttribute("viewBox", data.viewBox);

  var gKota = document.createElementNS(NS, "g");
  svg.appendChild(gKota);

  var garisSorot = document.createElementNS(NS, "path");
  garisSorot.setAttribute("id", "garis-sorot");
  svg.appendChild(garisSorot);

  var ins = data.inset;
  var bingkai = document.createElementNS(NS, "rect");
  bingkai.setAttribute("class", "bingkai-inset");
  bingkai.setAttribute("x", ins.x); bingkai.setAttribute("y", ins.y);
  bingkai.setAttribute("width", ins.w); bingkai.setAttribute("height", ins.h);
  bingkai.setAttribute("rx", 10);
  gKota.appendChild(bingkai);

  var label = document.createElementNS(NS, "text");
  label.setAttribute("class", "label-inset");
  label.setAttribute("x", ins.x + 14); label.setAttribute("y", ins.y + 24);
  label.innerHTML = '<tspan font-size="15" font-weight="600">Kepulauan Seribu</tspan>' +
                    '<tspan class="kecil" x="' + (ins.x + 14) + '" dy="17">inset, posisi pulau (tanpa skala)</tspan>';
  gKota.appendChild(label);

  data.kota.forEach(function (k) {
    var g = document.createElementNS(NS, "g");
    g.setAttribute("class", "kota");
    g.setAttribute("tabindex", "0");
    g.setAttribute("role", "button");
    g.setAttribute("aria-label", k.nama);
    g.style.setProperty("--warna", k.warna);
    g.style.setProperty("--pudar", pudar(k.warna));

    if (k.inset) {
      var hit = document.createElementNS(NS, "rect");
      hit.setAttribute("class", "area-hit");
      hit.setAttribute("x", ins.x); hit.setAttribute("y", ins.y);
      hit.setAttribute("width", ins.w); hit.setAttribute("height", ins.h);
      hit.setAttribute("rx", 10);
      g.appendChild(hit);
    }
    var p = document.createElementNS(NS, "path");
    p.setAttribute("class", "bentuk");
    p.setAttribute("d", k.d);
    g.appendChild(p);
    gKota.appendChild(g);

    var li = document.createElement("li");
    var tombol = document.createElement("button");
    tombol.type = "button";
    tombol.style.setProperty("--warna", k.warna);
    tombol.innerHTML = "<i></i>";
    tombol.appendChild(document.createTextNode(k.nama));
    li.appendChild(tombol);
    daftar.appendChild(li);

    var it = { data: k, g: g, tombol: tombol };
    item.push(it);

    g.addEventListener("pointerenter", function () { sorot(it); });
    g.addEventListener("pointermove", function (e) { geser(e); });
    g.addEventListener("pointerleave", function () { lepas(); });
    g.addEventListener("focus", function () { sorot(it, true); });
    g.addEventListener("blur", function () { lepas(); });
    g.addEventListener("click", function (e) { e.stopPropagation(); alihKunci(it); });
    g.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); alihKunci(it); }
    });

    tombol.addEventListener("pointerenter", function () { sorot(it, true); });
    tombol.addEventListener("pointerleave", function () { lepas(); });
    tombol.addEventListener("focus", function () { sorot(it, true); });
    tombol.addEventListener("blur", function () { lepas(); });
    tombol.addEventListener("click", function () { alihKunci(it); });
  });

  // klik di luar kota melepas kunci
  document.addEventListener("click", function () { if (kunci) { kunci = null; lepas(); } });

  /* ---------- Perilaku sorot ---------- */
  function tampil(it) {
    svg.classList.add("aktif");
    item.forEach(function (x) {
      var on = x === it;
      x.g.classList.toggle("sorot", on);
      x.tombol.classList.toggle("sorot", on);
    });
    garisSorot.setAttribute("d", it.data.d);
    infoNama.textContent = it.data.nama;
    infoJenis.textContent = it.data.inset ? "Kabupaten Administrasi" : "Kota Administrasi";
  }

  function sorot(it, tanpaTooltip) {
    tampil(it);
    tooltip.style.borderLeftColor = it.data.warna;
    if (tanpaTooltip) { tooltip.hidden = true; return; }
    tooltip.textContent = it.data.nama;
    tooltip.hidden = false;
  }

  function lepas() {
    tooltip.hidden = true;
    if (kunci) { tampil(kunci); return; }
    svg.classList.remove("aktif");
    item.forEach(function (x) {
      x.g.classList.remove("sorot");
      x.tombol.classList.remove("sorot");
    });
    garisSorot.removeAttribute("d");
    infoNama.textContent = "Arahkan kursor ke peta";
    infoJenis.textContent = "Wilayah";
  }

  function alihKunci(it) {
    kunci = kunci === it ? null : it;
    if (kunci) tampil(kunci); else lepas();
  }

  function geser(e) {
    var kotak = kartu.getBoundingClientRect();
    tooltip.style.left = e.clientX - kotak.left + "px";
    tooltip.style.top = e.clientY - kotak.top + "px";
  }
})();
