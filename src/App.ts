import dotenv from 'dotenv'
import { App, LogLevel } from '@slack/bolt'

import { SampleFormModal } from './Views'

dotenv.config()

const app = new App({
  logLevel:
    process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  socketMode: true,
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
})

// sample
app.message('こんにちは', async ({ message, say }) => {
  // @ts-expect-error: Bolt v3.4 で修正される予定
  // https://github.com/slackapi/bolt-js/issues/826
  await say(`:wave: こんにちは <@${message.user}>！`)
})

// sample
app.shortcut('socket-mode-shortcut', async ({ ack, body, client }) => {
  await ack()
  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: 'modal',
      callback_id: 'modal-id',
      title: {
        type: 'plain_text',
        text: 'タスク登録',
      },
      submit: {
        type: 'plain_text',
        text: '送信',
      },
      close: {
        type: 'plain_text',
        text: 'キャンセル',
      },
      blocks: [
        {
          type: 'input',
          block_id: 'input-task',
          element: {
            type: 'plain_text_input',
            action_id: 'input',
            multiline: true,
            placeholder: {
              type: 'plain_text',
              text: 'タスクの詳細・期限などを書いてください',
            },
          },
          label: {
            type: 'plain_text',
            text: 'タスク',
          },
        },
      ],
    },
  })
})

app.command('/sample_form_modal', async ({ ack, body, context, payload }) => {
  ack()

  const user_name: string = body.user_name

  try {
    app.client.views.open({
      token: context.botToken,
      trigger_id: payload.trigger_id,
      view: SampleFormModal({ name: user_name }),
    })
  } catch (error) {
    console.log(error)
  }
})

interface FormViewStateValues {
  values: {
    title: { title: { value: string } }
    tags: { tags: { value: string } }
    body: { body: { value: string } }
  }
}

app.view('send_form', async ({ ack, body, context, view }) => {
  ack()

  const user_id: string = body.user.id

  const form_view_state_values = (view.state as FormViewStateValues).values
  const form_title = form_view_state_values.title.title.value
  const form_tags = form_view_state_values.tags.tags.value
  const form_body = form_view_state_values.body.body.value

  app.client.chat.postMessage({
    token: context.botToken,
    channel: user_id,
    text: `Title: ${form_title}\nTags: ${form_tags}\nBody: ${form_body}`,
  })
})

const run = async () => {
  await app.start(Number(process.env.PORT) || 3000)

  console.log('⚡️ Bolt app is running!')
}

run()
