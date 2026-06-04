package expo.modules.assistintent

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AssistIntentModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AssistIntent")

    Events("assistIntent")

    OnCreate {
      AssistIntentState.setEventEmitter { sendEvent("assistIntent") }
    }

    OnDestroy {
      AssistIntentState.setEventEmitter(null)
    }

    AsyncFunction("consumePendingAssistIntent") {
      AssistIntentState.consumePendingAssistIntent()
    }
  }
}
