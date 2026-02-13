import type { FormEvent } from 'react'
import {
  ComponentRenderer,
  TamboProvider,
  useTambo,
  useTamboThreadInput,
  type TamboComponent,
} from '@tambo-ai/react'
import { z } from 'zod'
import './App.css'

type GraphProps = {
  data: Array<{ name: string; value: number }>
  type: 'line' | 'bar' | 'pie'
}

function Graph({ data, type }: GraphProps) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="demo-card">
      <div className="demo-head">Graph · {type}</div>
      <div className="bars">
        {data.map((d) => (
          <div key={d.name} className="bar-wrap">
            <div className="bar" style={{ height: `${(d.value / max) * 120 + 8}px` }} />
            <span>{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

type NoteProps = { title: string; content: string; color?: 'white' | 'yellow' | 'blue' | 'green' }
function Note({ title, content, color = 'yellow' }: NoteProps) {
  return (
    <div className={`note note-${color}`}>
      <h4>{title}</h4>
      <p>{content}</p>
    </div>
  )
}

const components: TamboComponent[] = [
  {
    name: 'Graph',
    description: '展示按月份的业务数据，可用于 line/bar/pie 视图',
    component: Graph,
    propsSchema: z.object({
      data: z.array(z.object({ name: z.string(), value: z.number() })),
      type: z.enum(['line', 'bar', 'pie']),
    }),
  },
  {
    name: 'TaskSummary',
    description: '任务摘要卡片，展示 todo / done / risk',
    component: ({ todo, done, risk }: { todo: number; done: number; risk: string }) => (
      <div className="demo-card">
        <div className="demo-head">Task Summary</div>
        <div className="kpis">
          <div><strong>{todo}</strong><span>Todo</span></div>
          <div><strong>{done}</strong><span>Done</span></div>
        </div>
        <p>风险提示：{risk}</p>
      </div>
    ),
    propsSchema: z.object({
      todo: z.number(),
      done: z.number(),
      risk: z.string(),
    }),
  },
  {
    name: 'Note',
    description: '便签组件，支持标题、内容和颜色',
    component: Note,
    propsSchema: z.object({
      title: z.string(),
      content: z.string(),
      color: z.enum(['white', 'yellow', 'blue', 'green']).optional(),
    }),
  },
]

function ChatUI() {
  const { messages, isStreaming, currentThreadId } = useTambo()
  const { value, setValue, submit, isPending } = useTamboThreadInput()

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await submit()
  }

  return (
    <>
      <section className="hint">
        <h3>真实 Tambo SDK 用法</h3>
        <p>这页已真实接入 <code>@tambo-ai/react</code>。你可以直接发送：
          <b>“Show me sales by month with a bar chart”</b>、
          <b>“Create a sticky note in blue”</b>。
        </p>
        <p className="mono">Thread: {currentThreadId} {isStreaming ? '· streaming' : ''}</p>
      </section>

      <section className="chat">
        {messages.map((m) => (
          <article className="msg" key={m.id}>
            <div className="role">{m.role}</div>
            <div className="content">
              {m.content.map((c, idx) => {
                if (c.type === 'text') return <p key={`${m.id}-t-${idx}`}>{c.text}</p>
                if (c.type === 'component') {
                  return (
                    <ComponentRenderer
                      key={c.id}
                      content={c}
                      threadId={currentThreadId}
                      messageId={m.id}
                      fallback={<pre>Unknown component: {c.name}</pre>}
                    />
                  )
                }
                if (c.type === 'tool_result') return <pre key={`${m.id}-tr-${idx}`}>{JSON.stringify(c, null, 2)}</pre>
                if (c.type === 'tool_use') return <pre key={`${m.id}-tu-${idx}`}>{JSON.stringify(c, null, 2)}</pre>
                return <pre key={`${m.id}-x-${idx}`}>{JSON.stringify(c, null, 2)}</pre>
              })}
            </div>
          </article>
        ))}
      </section>

      <form className="input" onSubmit={onSubmit}>
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Ask Tambo to render Graph/TaskSummary/Note..." />
        <button disabled={isPending}>{isPending ? 'Sending...' : 'Send'}</button>
      </form>
    </>
  )
}

export default function App() {
  const apiKey = import.meta.env.VITE_TAMBO_API_KEY as string | undefined
  const userKey = import.meta.env.VITE_TAMBO_USER_KEY as string | undefined

  if (!apiKey || !userKey) {
    return (
      <main className="page">
        <h1>需要配置 Tambo Key 才能真实交互</h1>
        <p>已接入真实 SDK，但当前缺少环境变量。</p>
        <pre>
{`在仓库根目录创建 .env：
VITE_TAMBO_API_KEY=your_tambo_api_key
VITE_TAMBO_USER_KEY=chenjiamian_demo_user`}
        </pre>
      </main>
    )
  }

  return (
    <TamboProvider apiKey={apiKey} userKey={userKey} components={components}>
      <main className="page">
        <h1>Tambo 真实交互组件站</h1>
        <p className="sub">React + @tambo-ai/react + Zod schemas + ComponentRenderer</p>
        <ChatUI />
      </main>
    </TamboProvider>
  )
}
