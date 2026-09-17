import { useEffect, useState } from 'react'

/**
 * 幅の狭い画面か（段落を分けるかどうかの判断に使う）。
 * スマホ（幅390px）では1行が20字ほどなので、100字の段落は5行の壁になる。
 * 狭い幅では文の切れ目で分け、広い幅ではそのまま出す（金継ぎの掟「段落の粒度は幅で決める」）。
 */
export function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const onChange = () => setNarrow(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return narrow
}
