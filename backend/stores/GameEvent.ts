import type { GameEventServer } from "common/types";
import { BACKEND_WALLET } from "backend/utils/aztec";
import { CLIENT_SESSION_DATA } from "backend/start";
import { EVENT } from "frontend/settings";
import { generateInterestPoints } from "backend/utils/InterestPoints";

function notifyNewEpoch(sessionId: string) {
  const socket = CLIENT_SESSION_DATA[sessionId].Socket;
  if (socket && socket.readyState === WebSocket.OPEN) socket.send("newEpoch");
}

function createGameEventServer(): GameEventServer {
  let epochIntervalId: Timer | undefined;
  const event: GameEventServer = {
    start: async function () {
      const epochCount = Number(
        await BACKEND_WALLET.contracts.gateway.methods.view_epoch_count().simulate(),
      );
      const epochStartTime = Number(
        await BACKEND_WALLET.contracts.gateway.methods
          .view_epoch_start_time()
          .simulate(),
      );

      if (epochCount > 1 && epochStartTime !== 0) {
        console.log("Reusing event");

        // sync with an event which is already started
        epochIntervalId = setTimeout(
          () => {
            epochIntervalId = setInterval(event.advanceEpoch, EVENT.EPOCH_DURATION);
          }, //
          Math.max(0, EVENT.EPOCH_DURATION - (Date.now() - epochStartTime)),
        );

        return;
      }

      epochIntervalId = setInterval(event.advanceEpoch, EVENT.EPOCH_DURATION);

      BACKEND_WALLET.contracts.gateway.methods
        .start_event(
          EVENT.MARKER_COUNT,
          EVENT.EPOCH_COUNT,
          EVENT.EPOCH_DURATION,
          Date.now(),
        )
        .send()
        .wait();

      console.log("new game");
      console.log(EVENT.EPOCH_COUNT, "epochs left");

      for (const sessionId in CLIENT_SESSION_DATA) {
        notifyNewEpoch(sessionId);
      }
    },

    stop: function () {
      clearInterval(epochIntervalId);
      epochIntervalId = undefined;
    },

    advanceEpoch: async function () {
      const epochCount = Number(
        await BACKEND_WALLET.contracts.gateway.methods.view_epoch_count().simulate(),
      );

      if (epochCount === 1) {
        clearInterval(epochIntervalId);
        epochIntervalId = undefined;

        epochIntervalId = setTimeout(event.start, EVENT.EPOCH_DURATION);

        return;
      }

      BACKEND_WALLET.contracts.gateway.methods.advance_epoch().send().wait();

      console.log(epochCount - 1, "epochs left");

      for (const sessionId in CLIENT_SESSION_DATA) {
        const session = CLIENT_SESSION_DATA[sessionId];

        if (!session.interestPoints) continue;

        const totalCount = session.interestPoints.length;
        if (totalCount === 0) {
          notifyNewEpoch(sessionId);
          continue;
        }

        generateInterestPoints(session, totalCount);
        notifyNewEpoch(sessionId);
      }
    },
  };

  return event;
}

export const GAME_EVENT = createGameEventServer();
