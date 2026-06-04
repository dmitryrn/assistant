package expo.modules.assistintent

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import expo.modules.core.interfaces.ReactActivityLifecycleListener

class AssistIntentReactActivityLifecycleListener : ReactActivityLifecycleListener {
  override fun onCreate(activity: Activity?, savedInstanceState: Bundle?) {
    handleIntent(activity?.intent)
  }

  override fun onNewIntent(intent: Intent?): Boolean {
    handleIntent(intent)

    if (intent?.action == Intent.ACTION_ASSIST) {
      return true
    }

    return false
  }

  private fun handleIntent(intent: Intent?) {
    if (intent?.action != Intent.ACTION_ASSIST) {
      return
    }

    AssistIntentState.notifyAssistIntent()
  }
}
