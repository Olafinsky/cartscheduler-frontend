import { Participant } from "../dto/entities/Participant";
type Props = {
    participants: Participant[];
    completedIds?: ReadonlySet<number>;
    onSelect: (participant: Participant) => void;
};

export default function ParticipantGrid({ participants, onSelect, completedIds }: Props) {
    return <div className="participant-grid">
        {participants.map(participant => <button
            key={participant.id}
            type="button"
            className={"participant-card" + (participant.id != null && completedIds?.has(participant.id) ? " participant-card--complete" : "")}
            onClick={() => onSelect(participant)}
        >
            <span className="participant-card__avatar" aria-hidden="true">
                {participant.name?.split(/\s+/).filter(Boolean).map(part => part[0]).slice(0, 2).join('')}
            </span>
            <span>{participant.name}</span>
            {participant.id != null && completedIds?.has(participant.id) && <span className="participant-check" role="img" aria-label="Dodano propozycję">✓</span>}
        </button>)}
    </div>;
}
