# Hardcoded English Text

## ..\src\components\chat\ChatFloatingButton.jsx
- Line 90: JSX Text: "99 ? '99+' : totalUnreadConversations}"

## ..\src\components\common\Avatar.jsx
- Line 35: JSX Text: ");
  }

  // Fallback: Initials
  const f = firstName?.charAt(0) || '';
  const l = lastName?.charAt(0) || '';
  const initials = (f + l).toUpperCase() || '?';
  
  // Font size relative to avatar size
  const fontSize = size * 0.4;

  return ("

## ..\src\components\common\EmptyState.jsx
- Line 35: JSX Text: ") : null}"

## ..\src\components\common\ErrorState.jsx
- Line 24: JSX Text: "Oops!"
- Line 29: JSX Text: "Try again"
- Line 30: JSX Text: ") : null}"

## ..\src\components\common\NotificationBadge.jsx
- Line 12: JSX Text: "99 ? '99+' : count}"

## ..\src\components\common\SkeletonCard.jsx
- Line 25: JSX Text: "pulse.stop();
  }, [opacity]);

  return ("

## ..\src\components\doctor\SlotPicker.jsx
- Line 73: JSX Text: "!s.isFree);
    const localizedLabel = item.label ? t(item.label) : formatIsoDate(item.date, 'weekday', t);
    const localizedDate = formatIsoDate(item.date, 'short', t);

    return ("
- Line 98: JSX Text: ");
  };

  return ("

## ..\src\components\doctor-dashboard\DoctorHeader.jsx
- Line 14: JSX Text: ";

  return ("

## ..\src\components\patient-dashboard\HealthOverview.jsx
- Line 48: JSX Text: "0 && !c.results[0]?.is_draft);
    if (completed.length === 0) return null;
    const latest = completed[0];
    const resultDate = new Date(latest.results[0]?.created_at || new Date());
    const now = new Date();
    const diffHours = (now - resultDate) / (1000 * 60 * 60);
    return diffHours"
- Line 82: JSX Text: "Results ready"
- Line 86: JSX Text: "The doctor has finished your summary & recommendations. You can view them now."
- Line 93: JSX Text: "View Results"
- Line 108: JSX Text: "Lab Results Ready"
- Line 111: JSX Text: "Your lab test results are ready for your review."
- Line 118: JSX Text: "View Lab Results"
- Line 138: JSX Text: "Preparing results"
- Line 143: JSX Text: "Your consultation has ended. The doctor is writing your summary & recommendations."
- Line 149: JSX Text: "Usually ready within 30 min"
- Line 156: JSX Text: "We'll notify you when ready"
- Line 171: JSX Text: "Waiting for Labs"
- Line 174: JSX Text: "Your lab test is being processed. We will notify you when it's ready."
- Line 178: JSX Text: ");
  }

  return ("

## ..\src\components\patient-dashboard\LabResultsBanner.jsx
- Line 51: JSX Text: "Ready for your review"

## ..\src\components\Stream\CallOverlay\index.native.jsx
- Line 57: JSX Text: "screen.width / 2;
        setLastSide(snapToRight ? 'right' : 'left');

        const targetX = snapToRight 
          ? screen.width - WIDGET_SIZE - EDGE_PADDING 
          : EDGE_PADDING;

        // Boundaries
        let targetY = finalY;
        const topBound = sizes.scale(60); 
        const bottomBound = screen.height - WIDGET_SIZE - NAV_BAR_HEIGHT;

        if (targetY"
- Line 117: JSX Text: "p.sessionId !== activeCall.state.localParticipant?.sessionId) || activeCall.state.localParticipant;

  return ("

## ..\src\components\Stream\CallOverlay\index.web.jsx
- Line 61: JSX Text: "screen.width / 2;
        setLastSide(snapToRight ? 'right' : 'left');
        
        const targetX = snapToRight 
          ? screen.width - WIDGET_SIZE - EDGE_PADDING 
          : EDGE_PADDING;

        // Boundary logic for Y
        let targetY = finalY;
        const topBound = EDGE_PADDING;
        const bottomBound = screen.height - WIDGET_SIZE - NAV_BAR_HEIGHT;

        if (targetY"
- Line 124: JSX Text: "p.sessionId !== activeCall.state.localParticipant?.sessionId) || activeCall.state.localParticipant;

  return ("

## ..\src\components\ui\BottomSheet.jsx
- Line 115: JSX Text: "1.5 && releasedHeight"
- Line 138: JSX Text: "= SCREEN_HEIGHT) return null;

  return ("

## ..\src\components\ui\Input.jsx
- Line 13: JSX Text: ": null}"
- Line 34: JSX Text: ": null}"
- Line 36: JSX Text: ": null}"

## ..\src\context\ChatNotificationContext.jsx
- Line 164: JSX Text: "listener.unsubscribe();
  }, [chatClient, session?.userId, addNotification, refreshUnreadCounts, t, session?.role]);

  return ("

## ..\src\managers\consultationManager.js
- Line 143: JSX Text: "= now && d"

## ..\src\screens\CallScreen\index.native.jsx
- Line 123: JSX Text: "You are muted. Tap to unmute"
- Line 133: JSX Text: "Waiting for others..."
- Line 170: JSX Text: "Muted"
- Line 184: JSX Text: "Minimize"
- Line 197: JSX Text: "Mute"
- Line 202: JSX Text: "Camera"
- Line 209: JSX Text: "End"
- Line 214: JSX Text: "Notes"
- Line 219: JSX Text: "Record"
- Line 224: JSX Text: "More"
- Line 347: JSX Text: "Connecting to call..."
- Line 356: JSX Text: ");
  }

  return ("
- Line 241: Prop (placeholder): "Type your note here..."
- Line 351: Prop (title): "Cancel"

## ..\src\screens\CallScreen\index.web.jsx
- Line 123: JSX Text: ");
  }

  return ("
- Line 225: JSX Text: "currentWindow.width / 2;
        setLastSide(snapToRight ? 'right' : 'left');

        const targetX = snapToRight
          ? currentWindow.width - PIP_WIDTH - EDGE_PADDING
          : EDGE_PADDING;

        // Boundary logic for Y
        let targetY = finalY;
        const topBound = sizes.scale(80); // Under top bar
        const bottomBound = currentWindow.height - PIP_HEIGHT - sizes.scale(130); // Above bottom bar

        if (targetY"
- Line 305: JSX Text: "Minimize"
- Line 368: JSX Text: "You are muted."
- Line 424: JSX Text: "Muted"
- Line 446: JSX Text: "Camera Issue"
- Line 449: JSX Text: "Failed to access video. Camera might be in use by another application."
- Line 461: JSX Text: "Mute"
- Line 466: JSX Text: "Camera"
- Line 473: JSX Text: "End"
- Line 478: JSX Text: "Notes"
- Line 483: JSX Text: "Record"
- Line 488: JSX Text: "More"
- Line 528: Prop (placeholder): "Type your note here..."

## ..\src\screens\chat\ChatListScreen.native.jsx
- Line 121: JSX Text: ");
  }

  return ("

## ..\src\screens\chat\ChatListScreen.web.jsx
- Line 61: JSX Text: "m.user_id !== client.userID)?.user;

  const name = otherMember?.name || otherMember?.id || 'User';
  const online = otherMember?.online;
  const lastActive = otherMember?.last_active;

  const subtitle = online ? t('chat.online') : formatLastActive(lastActive, t);

  return ("
- Line 135: JSX Text: "sub.remove();
  }, []);

  const isPortrait = dimensions.width"
- Line 224: JSX Text: ");
  }

  const showSidebar = !isPortrait || !selectedChannel;
  const showDetail = !isPortrait || !!selectedChannel;

  return ("
- Line 374: JSX Text: "0 && !isSelected;

                  return ("
- Line 440: JSX Text: "99 ? '99+' : unreadCount}"

## ..\src\screens\chat\ChatRoomScreen.native.jsx
- Line 36: JSX Text: ");
  }

  const isMy = isMyMessage(message);

  return ("
- Line 60: JSX Text: "(
              att.type === 'image' && att.image_url ? ("
- Line 140: JSX Text: "0 ? otherMembers[0].user : null;
  const name = otherUser?.name || 'Unknown';
  const avatar = otherUser?.image;
  const online = otherUser?.online;

  return ("

## ..\src\screens\chat\ChatRoomScreen.web.jsx
- Line 39: JSX Text: ");
  }

  return ("

## ..\src\screens\doctor\balance\DoctorBalanceTab.jsx
- Line 15: JSX Text: ";
  }

  return"

## ..\src\screens\doctor\balance\extra-screens\BalanceDashboard.jsx
- Line 211: JSX Text: ")
        ) : transactions.length === 0 ? ("

## ..\src\screens\doctor\balance\extra-screens\RequestPayout.jsx
- Line 72: JSX Text: "Privat Bank"

## ..\src\screens\doctor\balance\extra-screens\TransactionHistory.jsx
- Line 43: JSX Text: ") : transactions.length === 0 ? ("

## ..\src\screens\doctor\consultation\components\AvailabilityModal.jsx
- Line 315: JSX Text: ") : (
                    existingSlots.length === 0 ? ("
- Line 329: JSX Text: "Booked"

## ..\src\screens\doctor\consultation\DoctorConsultationTab.jsx
- Line 75: JSX Text: ";
  }

  return ("
- Line 93: JSX Text: "0;

          return ("

## ..\src\screens\doctor\consultation\extra-screens\DoctorConsultationForm.jsx
- Line 186: JSX Text: ");

  return ("
- Line 226: JSX Text: "Editing a sent summary — the patient will receive a notification about the update."
- Line 232: JSX Text: "Your private notes have been pre-filled below. Please adjust any formatting if needed before saving."
- Line 240: JSX Text: "Overview"
- Line 242: JSX Text: "Required"
- Line 262: JSX Text: "Patient has"
- Line 264: JSX Text: "Required"
- Line 297: JSX Text: "Add finding"
- Line 305: JSX Text: "Diagnosis"
- Line 307: JSX Text: "Required"
- Line 334: JSX Text: "Recommendations"
- Line 336: JSX Text: "Required"
- Line 369: JSX Text: "Add recommendation"
- Line 377: JSX Text: "Next steps"
- Line 379: JSX Text: "Required"
- Line 412: JSX Text: "Add step"
- Line 420: JSX Text: "Prescription"
- Line 422: JSX Text: "Optional"
- Line 247: Prop (placeholder): "e.g. During the consultation we discussed your test results."
- Line 276: Prop (placeholder): "e.g. Low ferritin"
- Line 313: Prop (label): "ICD-10 code"
- Line 314: Prop (placeholder): "e.g. D50"
- Line 321: Prop (label): "Diagnosis name"
- Line 322: Prop (placeholder): "e.g. Iron deficiency anemia"
- Line 348: Prop (placeholder): "e.g. Consider taking iron supplements"
- Line 391: Prop (placeholder): "e.g. Repeat tests in 4-6 weeks"
- Line 427: Prop (placeholder): "e.g. Vitamin D 5000 IU"

## ..\src\screens\doctor\consultation\extra-screens\DoctorConsultationSummary.jsx
- Line 101: JSX Text: "No result data found."
- Line 140: JSX Text: "Notes"
- Line 142: JSX Text: "Summary"
- Line 144: JSX Text: "Sent"
- Line 155: JSX Text: "You have:"
- Line 169: JSX Text: "Diagnosis"
- Line 210: JSX Text: "Prescriptions"
- Line 214: JSX Text: ") : null}"
- Line 99: Prop (title): "Consultation summary"
- Line 102: Prop (title): "Fill results"

## ..\src\screens\doctor\DoctorTabs.jsx
- Line 175: JSX Text: ");
  };

  return ("

## ..\src\screens\doctor\history\components\ConsultationTypesList.jsx
- Line 76: JSX Text: "Consultation •"

## ..\src\screens\doctor\history\DoctorHistoryTab.jsx
- Line 83: JSX Text: "c.status === 'canceled');

    return ("
- Line 90: JSX Text: ");
  };

  return ("

## ..\src\screens\doctor\history\extra-screens\AllConsultations.jsx
- Line 88: JSX Text: "All Consultations"
- Line 100: Prop (placeholder): "Search by patient"

## ..\src\screens\doctor\history\extra-screens\CompletedConsultation.jsx
- Line 180: JSX Text: "= todayStart && dateObj"
- Line 182: JSX Text: "= tomorrowStart && dateObj"
- Line 210: JSX Text: "Edit"
- Line 242: JSX Text: ") : null}"
- Line 289: JSX Text: ") : null}"
- Line 424: JSX Text: "Overview"
- Line 444: JSX Text: "Diagnosis"
- Line 459: JSX Text: "Recommendations"
- Line 476: JSX Text: "Next steps"
- Line 493: JSX Text: "Prescription"
- Line 502: JSX Text: ") : null}"

## ..\src\screens\doctor\history\extra-screens\DoctorRatings.jsx
- Line 147: JSX Text: "0 ? (count / total) : 0;
            return ("
- Line 185: JSX Text: ");

  return ("
- Line 223: JSX Text: ") : !isLoading ? ("

## ..\src\screens\doctor\history\extra-screens\PatientProfileSubView.jsx
- Line 75: JSX Text: "Patient profile"
- Line 171: JSX Text: ");

  return ("
- Line 176: JSX Text: "Personal info"
- Line 187: JSX Text: "Medical data"
- Line 193: JSX Text: "0 ? medicalData.conditions.join(', ') : 'Not detected', false)}"
- Line 197: JSX Text: "0 ? medicalData.medications.join(', ') : 'Not detected', false)}"
- Line 204: JSX Text: "Visit history with you"
- Line 279: JSX Text: "No lab results found."
- Line 381: JSX Text: ");

  return ("
- Line 392: JSX Text: "Uploaded from Labs"
- Line 394: JSX Text: "renderDocCard(doc, 'FileText', colors.danger, colors.danger + '20'))}"
- Line 401: JSX Text: "From consultations"
- Line 403: JSX Text: "renderDocCard(doc, 'FileText', colors.warning, colors.warning + '20'))}"
- Line 410: JSX Text: "No documents found."

## ..\src\screens\patient\consultation\components\TimerBlock.jsx
- Line 38: JSX Text: "(
          digit === ':' ? ("

## ..\src\screens\patient\consultation\ConsultationTab.jsx
- Line 245: JSX Text: ");
  }

  const groupedConsultations = consultationController.getGroupedConsultations();

  return ("
- Line 263: JSX Text: "0;

          return ("

## ..\src\screens\patient\consultation\extra-screens\ConsultationCalendar.jsx
- Line 28: JSX Text: "0;
    const isSelected = selectedDay === day;

    return ("
- Line 39: JSX Text: ");
  };

  return ("

## ..\src\screens\patient\consultation\extra-screens\PatientConsultationCard.jsx
- Line 162: JSX Text: ");

  return ("
- Line 207: JSX Text: "Consultation summary"
- Line 208: JSX Text: "Doctor's diagnosis, conclusion, recommendations & next steps."
- Line 214: JSX Text: "Files from this visit"
- Line 220: JSX Text: "Prescription_Jun5.pdf"
- Line 231: JSX Text: "Rate this consultation"
- Line 232: JSX Text: "Help others by sharing your experience"
- Line 316: JSX Text: "Reason for visit"
- Line 335: JSX Text: ") : isScheduled ? ("
- Line 350: JSX Text: ") : null}"
- Line 190: Prop (label): "Reason:"
- Line 241: Prop (placeholder): "Leave a comment (optional)"
- Line 253: Prop (title): "Submit rating"
- Line 140: Alert Title: "Success"
- Line 140: Alert Msg: "Rating submitted successfully!"

## ..\src\screens\patient\consultation\extra-screens\PatientConsultationRate.jsx
- Line 60: JSX Text: ");
  };

  return ("

## ..\src\screens\patient\doctors\DoctorsTab.jsx
- Line 113: JSX Text: ";
  }

  return ("

## ..\src\screens\patient\history\extra-screens\DoctorProfileSubView.jsx
- Line 60: JSX Text: "Doctor not found."
- Line 79: JSX Text: "Doctor profile"
- Line 139: JSX Text: ");

  return ("
- Line 144: JSX Text: "About"
- Line 149: JSX Text: "Details"
- Line 158: JSX Text: "Visit history with you"
- Line 197: JSX Text: "No previous visits."
- Line 212: JSX Text: "No reviews yet."
- Line 224: JSX Text: "No documents uploaded."

## ..\src\screens\patient\history\extra-screens\PatientAllConsultations.jsx
- Line 88: JSX Text: "All Consultations"
- Line 100: Prop (placeholder): "Search by doctor"

## ..\src\screens\patient\history\extra-screens\PatientCompletedConsultation.jsx
- Line 189: JSX Text: "= todayStart && dateObj"
- Line 191: JSX Text: "= tomorrowStart && dateObj"
- Line 260: JSX Text: ") : null}"
- Line 307: JSX Text: ") : null}"
- Line 346: JSX Text: "Consultation summary"
- Line 347: JSX Text: "Doctor's diagnosis, conclusion, recommendations & next steps."
- Line 357: JSX Text: "Consultation summary"

## ..\src\screens\patient\history\HistoryTab.jsx
- Line 70: JSX Text: "String(c.id) === String(historySelectedId));
    return"
- Line 75: JSX Text: ";
  }

  return ("

## ..\src\screens\patient\home\extra-screens\symptom-checker\Step6Result.jsx
- Line 41: JSX Text: "[2, 5, 6, 3].includes(r.id));

  const st = styles(sizes, colors);

  return ("

## ..\src\screens\patient\home\extra-screens\SymptomChecker.jsx
- Line 54: JSX Text: ";
    case 2: return"
- Line 55: JSX Text: ";
    case 3: return"
- Line 56: JSX Text: ";
    case 4: return"
- Line 57: JSX Text: ";
    case 5: return"
- Line 58: JSX Text: ";
    case 6: return"
- Line 59: JSX Text: ";
    default: return"

## ..\src\screens\patient\home\HomeTab.jsx
- Line 44: JSX Text: ";
  }

  return ("

## ..\src\screens\patient\PatientTabs.jsx
- Line 194: JSX Text: ");
  };

  return ("

## ..\src\screens\universal\profile\components\DocUploadSheet.jsx
- Line 133: JSX Text: ");
  };

  return ("
- Line 163: JSX Text: "setLicenseFile(index, file),
          )
        )}"

## ..\src\screens\universal\profile\components\ProfileEditForm.jsx
- Line 128: JSX Text: "0 && phone.length"
- Line 201: Prop (label): "Email"

## ..\src\screens\universal\profile\components\ProfileItem.jsx
- Line 36: JSX Text: ") : type === 'toggle' ? ("

## ..\src\screens\universal\profile\ProfileTab.jsx
- Line 170: JSX Text: ";
  }

  return ("
- Line 139: Alert Title: "Error"
- Line 150: Alert Title: "Error"

## ..\src\screens\universal\profile\SettingsLanguageScreen.jsx
- Line 87: JSX Text: ") : (
                      renderRadio(isSelected)
                    )}"

## ..\src\screens\universal\profile\SettingsNotificationsScreen.jsx
- Line 92: JSX Text: ");

  return ("

## ..\src\screens\universal\profile\SettingsVisibilityScreen.jsx
- Line 72: JSX Text: ");

  return ("

