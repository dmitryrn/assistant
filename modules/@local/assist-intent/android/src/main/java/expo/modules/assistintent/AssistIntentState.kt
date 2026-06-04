package expo.modules.assistintent

object AssistIntentState {
  private var pendingAssistIntent = false
  private var emitAssistIntent: (() -> Unit)? = null

  fun setEventEmitter(eventEmitter: (() -> Unit)?) {
    emitAssistIntent = eventEmitter

    if (pendingAssistIntent) {
      emitAssistIntent?.invoke()
    }
  }

  fun notifyAssistIntent() {
    pendingAssistIntent = true
    emitAssistIntent?.invoke()
  }

  fun consumePendingAssistIntent(): Boolean {
    if (!pendingAssistIntent) {
      return false
    }

    pendingAssistIntent = false
    return true
  }
}
