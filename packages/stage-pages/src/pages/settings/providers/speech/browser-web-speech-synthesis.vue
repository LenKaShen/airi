<script setup lang="ts">
import {
  ProviderBasicSettings,
  ProviderSettingsContainer,
  ProviderSettingsLayout,
} from '@proj-airi/stage-ui/components'
import { useSpeechStore } from '@proj-airi/stage-ui/stores/modules/speech'
import { useProvidersStore } from '@proj-airi/stage-ui/stores/providers'
import { Button, Callout, Textarea } from '@proj-airi/ui'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const providerId = 'browser-web-speech-synthesis'

const providersStore = useProvidersStore()
const speechStore = useSpeechStore()
const { activeSpeechVoiceId } = storeToRefs(speechStore)

const testText = ref('こんにちは。これはWeb Speech APIのテストです。')
const isSpeaking = ref(false)

const providerMetadata = computed(() => providersStore.getProviderMetadata(providerId))
const availableVoices = computed(() => speechStore.availableVoices[providerId] || [])

async function refreshVoices() {
  await speechStore.loadVoicesForProvider(providerId)
  if (!activeSpeechVoiceId.value && availableVoices.value.length > 0) {
    activeSpeechVoiceId.value = availableVoices.value[0].id
  }
}

async function speakTest() {
  if (!testText.value.trim()) {
    return
  }

  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
    return
  }

  const synth = window.speechSynthesis
  synth.cancel()

  const utterance = new SpeechSynthesisUtterance(testText.value)
  const selectedVoice = synth.getVoices().find(voice => (voice.voiceURI || voice.name) === activeSpeechVoiceId.value)

  if (selectedVoice) {
    utterance.voice = selectedVoice
    utterance.lang = selectedVoice.lang || utterance.lang
  }

  utterance.rate = 1.1
  utterance.pitch = 1
  utterance.volume = 1

  isSpeaking.value = true

  utterance.onend = () => {
    isSpeaking.value = false
  }

  utterance.onerror = () => {
    isSpeaking.value = false
  }

  synth.speak(utterance)
}

onMounted(async () => {
  providersStore.initializeProvider(providerId)
  providersStore.markProviderAdded(providerId)
  await providersStore.validateProvider(providerId, { force: true })
  await refreshVoices()
})
</script>

<template>
  <ProviderSettingsLayout
    :provider-name="providerMetadata?.localizedName"
    :provider-icon="providerMetadata?.icon"
    :provider-icon-color="providerMetadata?.iconColor"
    :on-back="() => router.back()"
  >
    <ProviderSettingsContainer class="w-full">
      <ProviderBasicSettings
        title="Browser TTS"
        description="Use built-in system voices through Web Speech Synthesis."
      >
        <Callout label="No API key required" theme="lime">
          This provider uses your browser/Electron runtime voices and is optimized for low-latency local playback.
        </Callout>

        <div :class="['flex', 'flex-col', 'gap-2']">
          <div>
            <div :class="['text-sm', 'font-medium']">
              Voice
            </div>
            <div :class="['text-xs', 'text-neutral-500', 'dark:text-neutral-400']">
              Pick a system voice for speech output
            </div>
          </div>
          <div :class="['overflow-auto', 'rounded-md', 'border', 'border-neutral-200', 'dark:border-neutral-700', 'max-h-64']">
            <table :class="['w-full', 'text-sm', 'border-collapse']">
              <thead :class="['sticky', 'top-0']">
                <tr :class="['border-b', 'border-neutral-200', 'dark:border-neutral-700', 'bg-neutral-50', 'dark:bg-neutral-800']">
                  <th :class="['px-3', 'py-2', 'text-left', 'font-medium']">
                    Voice Name
                  </th>
                  <th :class="['px-3', 'py-2', 'text-left', 'font-medium']">
                    Language
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="voice in availableVoices"
                  :key="voice.id"
                  :class="[
                    'cursor-pointer',
                    'transition-colors',
                    'border-b',
                    'border-neutral-100',
                    'dark:border-neutral-800',
                    'last:border-0',
                    activeSpeechVoiceId === voice.id
                      ? ['bg-blue-50', 'dark:bg-blue-900/20', 'font-medium']
                      : ['hover:bg-neutral-50', 'dark:hover:bg-neutral-800/60'],
                  ]"
                  @click="activeSpeechVoiceId = voice.id"
                >
                  <td :class="['px-3', 'py-2']">
                    {{ voice.name }}
                  </td>
                  <td :class="['px-3', 'py-2', 'text-neutral-500', 'dark:text-neutral-400']">
                    {{ voice.languages?.[0]?.code || '—' }}
                  </td>
                </tr>
                <tr v-if="availableVoices.length === 0">
                  <td colspan="2" :class="['px-3', 'py-6', 'text-center', 'text-neutral-400']">
                    No voices found. Click "Refresh Voices".
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <Textarea
          v-model="testText"
          label="Test Text"
          description="Try the selected system voice"
          placeholder="Enter text to test"
          rows="4"
        />

        <div class="flex gap-2">
          <Button @click="refreshVoices">
            Refresh Voices
          </Button>
          <Button :disabled="isSpeaking" @click="speakTest">
            {{ isSpeaking ? 'Speaking...' : 'Speak Test' }}
          </Button>
        </div>
      </ProviderBasicSettings>
    </ProviderSettingsContainer>
  </ProviderSettingsLayout>
</template>

<route lang="yaml">
meta:
  layout: settings
  stageTransition:
    name: slide
</route>
