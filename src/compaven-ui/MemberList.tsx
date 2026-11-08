import type { Household, HouseholdMember, Person } from "../storage/types";

interface MemberListProps {
  household: Household;
  persons: Person[];
  onRemoveMember?: (personId: string) => void;
}

export function MemberList({ household, persons, onRemoveMember }: MemberListProps) {
  const getPersonName = (personId: string) => {
    const person = persons.find((p) => p.id === personId);
    return person?.name ?? personId;
  };

  const activeMembers = household.members.filter((m) => !m.leftAt);
  const leftMembers = household.members.filter((m) => m.leftAt);

  return (
    <div style={{ fontFamily: "sans-serif", padding: "12px" }}>
      <h3>Aktívni členovia ({activeMembers.length})</h3>
      {activeMembers.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>Žiadni aktívni členovia</p>
      ) : (
        <div>
          {activeMembers.map((member) => (
            <div
              key={member.personId}
              style={{
                padding: "12px",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                marginBottom: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <strong>{getPersonName(member.personId)}</strong>
                <br />
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                  Rola: {member.memberRole} | Pridaný: {member.joinedAt}
                </span>
              </div>
              {onRemoveMember && member.memberRole !== "admin" && (
                <button
                  onClick={() => onRemoveMember(member.personId)}
                  style={{
                    padding: "4px 12px",
                    cursor: "pointer",
                    background: "var(--danger, red)",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                  }}
                >
                  Odstrániť
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {leftMembers.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h4>Odídení ({leftMembers.length})</h4>
          {leftMembers.map((member) => (
            <div key={member.personId} style={{ padding: "8px", color: "var(--muted)", fontSize: "12px" }}>
              {getPersonName(member.personId)} — odišiel {member.leftAt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
