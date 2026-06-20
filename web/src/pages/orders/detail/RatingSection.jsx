import { useState } from 'react'
import { Star } from 'lucide-react'
import styled from 'styled-components'
import api from '../../../lib/api'
import { StarDisplay, StarPicker } from '../../../components/StarRating'
import { Textarea, Button } from '../../../styles/index'

const RatingCardBox = styled.div`
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
`

const RatingCardTop = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
`

const RatingAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
  background: ${p => p.$bg};
  color: ${p => p.$color};
`

const RatingMeta = styled.div`
  flex: 1;
  min-width: 0;
`

const RatingName = styled.p`
  font-size: 13px;
  font-weight: 600;
  color: #1E293B;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const RatingRole = styled.p`
  font-size: 11px;
  color: #94A3B8;
`

const RatingScoreWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`

const ScoreText = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: #374151;
`

const ScoreSub = styled.span`
  font-size: 11px;
  font-weight: 400;
  color: #94A3B8;
`

const RatingComment = styled.p`
  font-size: 13px;
  color: #475569;
  background: #F8FAFC;
  border-radius: 12px;
  padding: 8px 12px;
  line-height: 1.5;
`

const RatingFormBox = styled.div`
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
`

const FormTopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
`

const StarIconBox = styled.div`
  width: 32px;
  height: 32px;
  background: #FEF9C3;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #EAB308;
`

const FormTitle = styled.h3`
  font-weight: 600;
  color: #1E293B;
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const SubmitBtn = styled(Button)`
  align-self: flex-start;
  padding: 8px 20px;
  border-radius: 12px;
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`

const SectionWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
`

function RatingCard({ label, name, avatarBg, avatarColor, score, comment }) {
  const initial = name?.charAt(0).toUpperCase() ?? '?'
  return (
    <RatingCardBox>
      <RatingCardTop>
        <RatingAvatar $bg={avatarBg} $color={avatarColor}>{initial}</RatingAvatar>
        <RatingMeta>
          <RatingName>{name ?? '—'}</RatingName>
          <RatingRole>{label}</RatingRole>
        </RatingMeta>
        <RatingScoreWrap>
          <StarDisplay score={score} size={14} />
          <ScoreText>{score}<ScoreSub>/5</ScoreSub></ScoreText>
        </RatingScoreWrap>
      </RatingCardTop>
      {comment && (
        <RatingComment>&ldquo;{comment}&rdquo;</RatingComment>
      )}
    </RatingCardBox>
  )
}

function RatingForm({ title, placeholder, onSubmit, loading }) {
  const [score, setScore] = useState(0)
  const [comment, setComment] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!score) return
    await onSubmit({ score, comment })
  }

  return (
    <RatingFormBox>
      <FormTopRow>
        <StarIconBox>
          <Star size={15} strokeWidth={2.5} />
        </StarIconBox>
        <FormTitle>{title}</FormTitle>
      </FormTopRow>
      <Form onSubmit={handleSubmit}>
        <StarPicker value={score} onChange={setScore} />
        <Textarea
          rows={2}
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder={placeholder}
          style={{ resize: 'none', borderRadius: '12px' }}
        />
        <SubmitBtn type="submit" disabled={!score || loading}>
          {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
        </SubmitBtn>
      </Form>
    </RatingFormBox>
  )
}

export default function RatingSection({ orderId, rating, isSender, isDriver, orderStatus, onSuccess }) {
  const [loadingSender, setLoadingSender] = useState(false)
  const [loadingDriver, setLoadingDriver] = useState(false)

  const submitDriverRating = async ({ score, comment }) => {
    setLoadingSender(true)
    try {
      await api.post(`/orders/${orderId}/rate`, { score, comment })
      onSuccess()
    } finally {
      setLoadingSender(false)
    }
  }

  const submitSenderRating = async ({ score, comment }) => {
    setLoadingDriver(true)
    try {
      await api.post(`/orders/${orderId}/rate-sender`, { score, comment })
      onSuccess()
    } finally {
      setLoadingDriver(false)
    }
  }

  if (orderStatus !== 'delivered') return null

  const hasDriverRating = rating?.score != null
  const hasSenderRating = rating?.driver_score != null

  return (
    <SectionWrap>
      {hasDriverRating ? (
        <RatingCard
          label="Người gửi đánh giá tài xế"
          name={rating.sender?.name}
          avatarBg="#FEF9C3"
          avatarColor="#92400E"
          score={rating.score}
          comment={rating.comment}
        />
      ) : isSender ? (
        <RatingForm
          title="Đánh giá tài xế"
          placeholder="Nhận xét về tài xế (tuỳ chọn)..."
          onSubmit={submitDriverRating}
          loading={loadingSender}
        />
      ) : null}

      {hasSenderRating ? (
        <RatingCard
          label="Tài xế đánh giá người gửi"
          name={rating.driver?.name}
          avatarBg="#FFEDD5"
          avatarColor="#EA580C"
          score={rating.driver_score}
          comment={rating.driver_comment}
        />
      ) : isDriver ? (
        <RatingForm
          title="Đánh giá người gửi"
          placeholder="Nhận xét về người gửi (tuỳ chọn)..."
          onSubmit={submitSenderRating}
          loading={loadingDriver}
        />
      ) : null}
    </SectionWrap>
  )
}
