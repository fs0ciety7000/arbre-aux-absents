// Copiée par .github/workflows/tauri.yml dans gen/android après `tauri android init`
// (gen/android n'est pas versionné). Android 15 dessine l'app bord à bord : sans ce décalage,
// la barre d'état recouvre le haut du jeu et la barre de navigation le menu du bas.
package org.cardormedia.arbreauxabsents

import android.graphics.Color
import android.os.Bundle
import android.view.View
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    // Bord à bord sur toutes les versions, pour que le décalage ci-dessous soit le même partout.
    WindowCompat.setDecorFitsSystemWindows(window, false)
    // Fond des bandes système : --canvas (#07152e), icônes claires.
    val root = findViewById<View>(android.R.id.content)
    root.setBackgroundColor(Color.parseColor("#07152e"))
    WindowCompat.getInsetsController(window, window.decorView).apply {
      isAppearanceLightStatusBars = false
      isAppearanceLightNavigationBars = false
    }
    ViewCompat.setOnApplyWindowInsetsListener(root) { view, insets ->
      val bars = insets.getInsets(
        WindowInsetsCompat.Type.systemBars() or
          WindowInsetsCompat.Type.displayCutout() or
          WindowInsetsCompat.Type.ime()
      )
      view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
      WindowInsetsCompat.CONSUMED
    }
  }
}
